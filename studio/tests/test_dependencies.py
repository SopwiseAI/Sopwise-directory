"""依赖声明的回归测试。

这两条测试守的都是"只在特定环境才会炸、本机恰好覆盖不到"的依赖:
MySQL 8 的 caching_sha2_password 认证需要 cryptography, 而 dev 库是 MySQL 5.7
(mysql_native_password), 本地怎么跑都碰不到那条代码路径。

放进 pytest 是为了让"把 cryptography 从 pyproject 里删掉"这件事立刻变红 —— 依赖
声明本身没有别的机制能测, 只能这样钉住。断言走 importlib.metadata 而不是直接 import,
顺带保证它被声明在【运行时】依赖里, 而不是靠某个传递依赖碰巧带进来。
"""

from importlib.metadata import requires

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa


def _runtime_requirements() -> list[str]:
    """studio 在 METADATA 里直接声明的运行时依赖(dev 组不会出现在这里)。"""
    return list(requires("studio") or [])


def test_cryptography_is_a_declared_runtime_dependency():
    assert any(req.split()[0].startswith("cryptography") for req in _runtime_requirements())


def test_pymysql_sees_cryptography():
    # PyMySQL 在 import 时探测一次 cryptography; 探测不到就会在 MySQL 8 首次连接时
    # 抛 RuntimeError('cryptography' package is required ...) —— 见 pymysql/_auth.py
    from pymysql import _auth

    assert _auth._have_cryptography is True


def test_caching_sha2_full_auth_primitive_roundtrip():
    """复现 MySQL 8 full auth 用的那一步: 服务端公钥加密密码。

    这条是本文件存在的主要理由: 它证明的不是"cryptography 能 import", 而是
    PyMySQL 的 sha2_rsa_encrypt 真的能跑完并产出可解密的数据 —— 也就是 prod 在
    非 TLS 连接上走 caching_sha2(full auth)时依赖的那条路径。
    """
    from pymysql import _auth

    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    public_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    password = b"p@ss"
    # MySQL 的 scramble 固定 20 字节
    salt = b"0123456789abcdefghij"

    ciphertext = _auth.sha2_rsa_encrypt(password, salt, public_pem)

    recovered = private_key.decrypt(
        ciphertext,
        padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA1()), algorithm=hashes.SHA1(), label=None),
    )
    # PyMySQL 先做 password + "\0" 再按 salt 逐字节异或(salt 会被截到 SCRAMBLE_LENGTH)
    expected = bytes(byte ^ salt[index % len(salt)] for index, byte in enumerate(password + b"\0"))
    assert recovered == expected
