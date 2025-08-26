// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import api from "../api";

// export default function LoginPage() {
//     const [useradi, setUseradi] = useState("");
//     const [sifre, setSifre] = useState("");
//     const [error, setError] = useState("");
//     const navigate = useNavigate();

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setError("");
//         try {
//             const res = await api.post("api/auth/login", {
//                 useradi,
//                 sifre,
//             });

//             const token = res.data.accessToken;
//             console.log("Backend cevabı:", res.data);

//             if (!token) {
//                 setError("Token alınamadı, giriş başarısız.");
//                 return;
//             }

//             localStorage.setItem("token", token);
//             navigate("/dashboard");
//         } catch (err) {
//             console.error("Login hatası:", err.response?.data || err.message);
//             setError("Giriş başarısız. Kullanıcı adı veya şifre yanlış.");
//         }
//     };

//     return (
//         <div
//             style={{
//                 display: "flex",
//                 justifyContent: "center",
//                 alignItems: "center",
//                 minHeight: "100vh",
//                 backgroundColor: "#8EBD58",
//                 width: "100vw", // Sayfanın tam genişliğini kaplar
//             }}
//         >
//             <div
//                 style={{
//                     maxWidth: 400,
//                     width: "100%",
//                     padding: 40,
//                     backgroundColor: "#8758BD",
//                     borderRadius: 8,
//                     boxShadow: "0 4px 6px rgba(67, 142, 69, 0.1)",
//                     textAlign: "center" // İçerideki metni de ortalar
//                 }}
//             >
//                 <h2>Giriş Yap</h2>
//                 <form onSubmit={handleSubmit}>
//                     <input
//                         type="text"
//                         placeholder="Kullanıcı Adı"
//                         value={useradi}
//                         onChange={(e) => setUseradi(e.target.value)}
//                         required
//                         style={{ width: "100%", padding: 12, marginBottom: 15 }}
//                     />
//                     <input
//                         type="password"
//                         placeholder="Şifre"
//                         value={sifre}
//                         onChange={(e) => setSifre(e.target.value)}
//                         required
//                         style={{ width: "100%", padding: 12, marginBottom: 15 }}
//                     />
//                     <button type="submit" style={{ width: "100%", padding: 12 }}>
//                         Giriş Yap
//                     </button>
//                 </form>
//                 {error && <p style={{ color: "red", marginTop: 15 }}>{error}</p>}
//             </div>
//         </div>
//     );
// }

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function LoginPage() {
    const [useradi, setUseradi] = useState("");
    const [sifre, setSifre] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isAddingUser, setIsAddingUser] = useState(false);

    // Yeni kullanıcı ekleme için state'ler
    const [newUseradi, setNewUseradi] = useState("");
    const [newSifre, setNewSifre] = useState("");
    const [userRole, setUserRole] = useState("user");
    const [confirmSifre, setConfirmSifre] = useState("");

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        try {
            const res = await api.post("api/auth/login", {
                useradi,
                sifre,
            });

            const token = res.data.accessToken;
            console.log("Backend cevabı:", res.data);

            if (!token) {
                setError("Token alınamadı, giriş başarısız.");
                return;
            }

            localStorage.setItem("token", token);
            navigate("/dashboard");
        } catch (err) {
            console.error("Login hatası:", err.response?.data || err.message);
            setError("Giriş başarısız. Kullanıcı adı veya şifre yanlış.");
        }
    };

    const generateRoleBasedPassword = (username, role) => {
        const rolePrefix = { admin: "ADM", user: "USR" };
        const prefix = rolePrefix[role] || "USR";
        const userPart = username.substring(0, 3).toUpperCase();
        const randomNum = Math.floor(Math.random() * 9999)
            .toString()
            .padStart(4, "0");
        return `${prefix}${userPart}${randomNum}`;
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (newUseradi.length < 3) {
            setError("Kullanıcı adı en az 3 karakter olmalıdır.");
            return;
        }

        if (newSifre && newSifre !== confirmSifre) {
            setError("Şifreler eşleşmiyor.");
            return;
        }

        try {
            const finalPassword =
                newSifre || generateRoleBasedPassword(newUseradi, userRole);

            await api.post("api/register", {
                useradi: newUseradi,
                sifre: finalPassword,
                role: userRole,
            });

            setSuccess(
                `Kullanıcı başarıyla eklendi! ${!newSifre ? `Otomatik şifre: ${finalPassword}` : ""
                }`
            );

            setNewUseradi("");
            setNewSifre("");
            setConfirmSifre("");
            setUserRole("user");
        } catch (err) {
            console.error("Kullanıcı ekleme hatası:", err.response?.data || err.message);
            setError(
                "Kullanıcı eklenirken hata oluştu. " +
                (err.response?.data?.message || "")
            );
        }
    };

    const toggleMode = () => {
        setIsAddingUser(!isAddingUser);
        setError("");
        setSuccess("");
        setUseradi("");
        setSifre("");
        setNewUseradi("");
        setNewSifre("");
        setConfirmSifre("");
        setUserRole("user");
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column", // buton altta görünsün diye
                justifyContent: "center",
                alignItems: "center",
                minHeight: "100vh",
                backgroundColor: "#8EBD58",
                width: "100vw",
            }}
        >
            <div
                style={{
                    maxWidth: 450,
                    width: "100%",
                    padding: 40,
                    backgroundColor: "#8758BD",
                    borderRadius: 8,
                    boxShadow: "0 4px 6px rgba(67, 142, 69, 0.1)",
                    textAlign: "center",
                }}
            >
                {!isAddingUser ? (
                    // Giriş Yap Formu
                    <>
                        <h2>Giriş Yap</h2>
                        <form onSubmit={handleLogin}>
                            <input
                                type="text"
                                placeholder="Kullanıcı Adı"
                                value={useradi}
                                onChange={(e) => setUseradi(e.target.value)}
                                required
                                style={{ width: "100%", padding: 12, marginBottom: 15 }}
                            />
                            <input
                                type="password"
                                placeholder="Şifre"
                                value={sifre}
                                onChange={(e) => setSifre(e.target.value)}
                                required
                                style={{ width: "100%", padding: 12, marginBottom: 15 }}
                            />
                            <button
                                type="submit"
                                style={{
                                    width: "100%",
                                    padding: 12,
                                    backgroundColor: "#6a4c93",
                                    color: "white",
                                    border: "none",
                                    borderRadius: 4,
                                    cursor: "pointer",
                                }}
                            >
                                Giriş Yap
                            </button>
                        </form>
                    </>
                ) : (
                    // Yeni Kullanıcı Ekleme Formu
                    <>
                        <h2>Yeni Kullanıcı Ekle</h2>
                        <form onSubmit={handleAddUser}>
                            <input
                                type="text"
                                placeholder="Kullanıcı Adı"
                                value={newUseradi}
                                onChange={(e) => setNewUseradi(e.target.value)}
                                required
                                style={{ width: "100%", padding: 12, marginBottom: 15 }}
                            />
                            <select
                                value={userRole}
                                onChange={(e) => setUserRole(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: 12,
                                    marginBottom: 15,
                                    borderRadius: 4,
                                    border: "1px solid #ddd",
                                }}
                            >
                                <option value="user">Kullanıcı</option>
                                <option value="admin">Admin</option>
                            </select>
                            <div style={{ marginBottom: 15, textAlign: "left" }}>
                                <small style={{ color: "#f0f0f0" }}>
                                    Şifre boş bırakılırsa, rol bazlı otomatik şifre üretilir
                                </small>
                            </div>
                            <input
                                type="password"
                                placeholder="Şifre (opsiyonel - otomatik üretilir)"
                                value={newSifre}
                                onChange={(e) => setNewSifre(e.target.value)}
                                style={{ width: "100%", padding: 12, marginBottom: 15 }}
                            />
                            {newSifre && (
                                <input
                                    type="password"
                                    placeholder="Şifre Tekrar"
                                    value={confirmSifre}
                                    onChange={(e) => setConfirmSifre(e.target.value)}
                                    required={newSifre.length > 0}
                                    style={{ width: "100%", padding: 12, marginBottom: 15 }}
                                />
                            )}
                            <button
                                type="submit"
                                style={{
                                    width: "100%",
                                    padding: 12,
                                    backgroundColor: "#6a4c93",
                                    color: "white",
                                    border: "none",
                                    borderRadius: 4,
                                    cursor: "pointer",
                                }}
                            >
                                Kullanıcı Ekle
                            </button>
                        </form>
                    </>
                )}

                {error && (
                    <p
                        style={{
                            color: "#ff6b6b",
                            marginTop: 15,
                            backgroundColor: "rgba(255,255,255,0.1)",
                            padding: 10,
                            borderRadius: 4,
                        }}
                    >
                        {error}
                    </p>
                )}
                {success && (
                    <p
                        style={{
                            color: "#51cf66",
                            marginTop: 15,
                            backgroundColor: "rgba(255,255,255,0.1)",
                            padding: 10,
                            borderRadius: 4,
                        }}
                    >
                        {success}
                    </p>
                )}
            </div>

            <div style={{ marginTop: 20 }}>
                <button
                    type="button"
                    onClick={toggleMode}
                    style={{
                        padding: "8px 16px",
                        backgroundColor: "#BD585C",
                        color: "white",
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontSize: "14px",
                    }}
                >
                    {isAddingUser ? "Giriş Yap'a Dön" : "Yeni Kullanıcı Ekle"}
                </button>
            </div>
        </div>
    );
}
