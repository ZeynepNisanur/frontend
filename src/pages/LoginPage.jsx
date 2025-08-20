// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";

// export default function LoginPage() {
//     const [useradi, setUseradi] = useState("");
//     const [sifre, setSifre] = useState("");
//     const [error, setError] = useState("");
//     const navigate = useNavigate();

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setError("");
//         try {
//             const res = await axios.post("http://localhost:8081/api/auth/login", {
//                 useradi,
//                 sifre,
//             });
//             const token = res.data.token;
//             localStorage.setItem("token", token);
//             navigate("/dashboard");
//         } catch {
//             setError("Giriş başarısız. Kullanıcı adı veya şifre yanlış.");
//         }
//     };

//     return (
//         <div style={{ maxWidth: 320, margin: "auto", padding: 20 }}>
//             <h2>Giriş Yap</h2>
//             <form onSubmit={handleSubmit}>
//                 <input
//                     type="text"
//                     placeholder="Kullanıcı Adı"
//                     value={useradi}
//                     onChange={(e) => setUseradi(e.target.value)}
//                     required
//                     style={{ width: "100%", padding: 8, marginBottom: 12 }}
//                 />
//                 <input
//                     type="password"
//                     placeholder="Şifre"
//                     value={sifre}
//                     onChange={(e) => setSifre(e.target.value)}
//                     required
//                     style={{ width: "100%", padding: 8, marginBottom: 12 }}
//                 />
//                 <button type="submit" style={{ width: "100%", padding: 8 }}>
//                     Giriş Yap
//                 </button>
//             </form>
//             {error && <p style={{ color: "red" }}>{error}</p>}
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
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
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

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "100vh",
                backgroundColor: "#8EBD58",
                width: "100vw", // Sayfanın tam genişliğini kaplar
            }}
        >
            <div
                style={{
                    maxWidth: 400,
                    width: "100%",
                    padding: 40,
                    backgroundColor: "#8758BD",
                    borderRadius: 8,
                    boxShadow: "0 4px 6px rgba(67, 142, 69, 0.1)",
                    textAlign: "center" // İçerideki metni de ortalar
                }}
            >
                <h2>Giriş Yap</h2>
                <form onSubmit={handleSubmit}>
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
                    <button type="submit" style={{ width: "100%", padding: 12 }}>
                        Giriş Yap
                    </button>
                </form>
                {error && <p style={{ color: "red", marginTop: 15 }}>{error}</p>}
            </div>
        </div>
    );
}



// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { User, Lock, Eye, EyeOff, LogIn, AlertCircle, Shield } from "lucide-react";
// import api from "../api";

// export default function LoginPage() {
//     const [username, setUsername] = useState("");
//     const [password, setPassword] = useState("");
//     const [error, setError] = useState("");
//     const [showPassword, setShowPassword] = useState(false);
//     const [isLoading, setIsLoading] = useState(false);
//     const navigate = useNavigate();

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setError("");
//         setIsLoading(true);

//         try {
//             const res = await api.post("api/auth/login", {
//                 useradi: username,  // Backend'iniz useradi bekliyor
//                 sifre: password,    // Backend'iniz sifre bekliyor
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
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
//             {/* Animated Background Elements */}
//     /*<div className="absolute inset-0 overflow-hidden">
//     <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
//     <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
//     <div className="absolute top-3/4 left-1/2 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
// </div>

// {/* Main Container */ }
// /*<div className="relative z-10 w-full max-w-md mx-auto px-4 sm:px-6 lg:px-8">
//     {/* Glass Card */}
//     <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl transform transition-all duration-500 hover:scale-[1.02]">
//         {/* Header */}
//         <div className="text-center mb-6 sm:mb-8">
//             <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4 shadow-lg transform transition-transform hover:rotate-12">
//                 <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
//             </div>
//             <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
//                 Hoş Geldiniz
//             </h1>
//             <p className="text-white/70 text-sm sm:text-base">
//                 Hesabınıza güvenli giriş yapın
//             </p>
//         </div>

//         {/* Error Message */}
//         {error && (
//             <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-xl backdrop-blur-sm animate-shake">
//                 <div className="flex items-center">
//                     <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 mr-2 sm:mr-3 flex-shrink-0" />
//                     <p className="text-red-300 text-xs sm:text-sm">{error}</p>
//                 </div>
//             </div>
//         )}

//         {/* Login Form */}
//         <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
//             {/* Username Field */}
//             <div>
//                 <label className="block text-white/90 text-xs sm:text-sm font-medium mb-2">
//                     Kullanıcı Adı
//                 </label>
//                 <div className="relative">
//                     <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
//                         <User className="w-4 h-4 sm:w-5 sm:h-5 text-white/50" />
//                     </div>
//                     <input
//                         type="text"
//                         placeholder="Kullanıcı adınızı girin"
//                         value={username}
//                         onChange={(e) => setUsername(e.target.value)}
//                         required
//                         className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-purple-400 focus:bg-white/20 transition-all duration-300 backdrop-blur-sm text-sm sm:text-base"
//                     />
//                 </div>
//             </div>

//             {/* Password Field */}
//             <div>
//                 <label className="block text-white/90 text-xs sm:text-sm font-medium mb-2">
//                     Şifre
//                 </label>
//                 <div className="relative">
//                     <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
//                         <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-white/50" />
//                     </div>
//                     <input
//                         type={showPassword ? "text" : "password"}
//                         placeholder="Şifrenizi girin"
//                         value={password}
//                         onChange={(e) => setPassword(e.target.value)}
//                         required
//                         className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-purple-400 focus:bg-white/20 transition-all duration-300 backdrop-blur-sm text-sm sm:text-base"
//                     />
//                     <button
//                         type="button"
//                         className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center"
//                         onClick={() => setShowPassword(!showPassword)}
//                     >
//                         {showPassword ? (
//                             <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-white/50 hover:text-white/80 transition-colors" />
//                         ) : (
//                             <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-white/50 hover:text-white/80 transition-colors" />
//                         )}
//                     </button>
//                 </div>
//             </div>

//             {/* Remember Me & Forgot Password */}
//             <div className="flex items-center justify-between">
//                 <label className="flex items-center cursor-pointer">
//                     <input
//                         type="checkbox"
//                         className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-400 focus:ring-2"
//                     />
//                     <span className="ml-2 text-white/70 text-xs sm:text-sm">Beni hatırla</span>
//                 </label>
//                 <a href="#" className="text-purple-300 hover:text-purple-200 text-xs sm:text-sm font-medium transition-colors">
//                     Şifremi unuttum
//                 </a>
//             </div>

//             {/* Login Button */}
//             <button
//                 type="submit"
//                 disabled={isLoading}
//                 className="w-full py-2.5 sm:py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-purple-500/50 disabled:to-pink-500/50 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center text-sm sm:text-base"
//             >
//                 {isLoading ? (
//                     <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
//                 ) : (
//                     <>
//                         <LogIn className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
//                         Giriş Yap
//                     </>
//                 )}
//             </button>
//         </form>

//         {/* Divider */}
//         <div className="my-6 sm:my-8 flex items-center">
//             <div className="flex-1 border-t border-white/20"></div>
//             <span className="px-3 sm:px-4 text-white/50 text-xs sm:text-sm">veya</span>
//             <div className="flex-1 border-t border-white/20"></div>
//         </div>

//         {/* Sign Up Link */}
//         <div className="text-center">
//             <p className="text-white/70 text-xs sm:text-sm">
//                 Hesabınız yok mu?{' '}
//                 <a href="#" className="text-purple-300 hover:text-purple-200 font-medium transition-colors">
//                     Hemen kayıt olun
//                 </a>
//             </p>
//         </div>
//     </div>

//     {/* Footer */}
//     <div className="text-center mt-6 sm:mt-8">
//         <p className="text-white/50 text-xs">
//             © 2024 Güvenli Giriş Sistemi. Tüm hakları saklıdır.
//         </p>
//     </div>
// </div>
//         </div >
//     );
// }
// */