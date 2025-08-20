// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import jwt_decode from 'jwt-decode';
// import { useNavigate } from "react-router-dom";
// import api from "../api";
// import Calisanlar from "../pages/Calisanlar.jsx";
// import Projeler from "../pages/Projeler.jsx";

// export default function Dashboard() {
//     const [role, setRole] = useState(null);
//     const [username, setUsername] = useState("");
//     const [dashboardData, setDashboardData] = useState(null);
//     const [calisanlarOzet, setCalisanlarOzet] = useState(null);
//     const [projelerOzet, setProjelerOzet] = useState(null);
//     const [hizliIstatistikler, setHizliIstatistikler] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState("");
//     const [activeTab, setActiveTab] = useState("dashboard");
//     const navigate = useNavigate();
//     const [rolesState, setRolesState] = useState([]);

//     // ortak başlık renkleri
//     const headingGray = '#6b7280'; // Tailwind karşılığı: text-gray-500
//     const h2Style = { color: headingGray, margin: '0 0 12px 0' };
//     const h3Style = { color: headingGray, margin: '0 0 10px 0' };

//     const authHeaders = () => ({
//         Authorization: `Bearer ${localStorage.getItem("token")}`,
//     });

//     const formatDate = (val) => {
//         if (!val) return 'Belirtilmemiş';
//         const d = new Date(val);
//         if (isNaN(d.getTime())) return String(val); // backenden string geldiyse
//         return d.toLocaleDateString('tr-TR', {
//             year: 'numeric',
//             month: 'long',
//             day: 'numeric'
//         });
//     };

//     const refreshAll = async () => {
//         try {
//             const token = localStorage.getItem("token");
//             if (!token) return;
//             await fetchDashboardData(token, rolesState);
//         } catch (e) {
//             console.error("Yenileme hatası:", e);
//         }
//     };

//     useEffect(() => {
//         const token = localStorage.getItem("token");
//         console.log("Token:", token);

//         if (!token) {
//             navigate("/");
//             return;
//         }

//         try {
//             // Token'ı decode edilmesi
//             const decoded = jwt_decode(token);
//             console.log("Decoded token:", decoded);

//             const roles = decoded.roles || [];
//             setUsername(decoded.sub || "");
//             setRolesState(roles);

//             if (roles.includes("ROLE_ADMIN")) setRole("ADMIN");
//             else if (roles.includes("ROLE_USER")) setRole("USER");
//             else setRole("UNKNOWN");

//             // Dashboard verisini çek
//             fetchDashboardData(token, roles);
//         } catch (e) {
//             console.error("Token decode hatası", e);
//             localStorage.removeItem("token");
//             navigate("/");
//         }
//     }, [navigate]);

//     const fetchDashboardData = async (token, roles) => {
//         const headers = { Authorization: `Bearer ${token}` };
//         const isAdmin = roles.includes("ROLE_ADMIN");

//         try {
//             // Ana dashboard verisi
//             const dashboardRes = await api.get("/api/dashboard", { headers });
//             setDashboardData(dashboardRes.data);

//             // Admin ise ek veriler çek
//             if (isAdmin) {
//                 try {
//                     const [calisanlarRes, hizliStatsRes] = await Promise.all([
//                         api.get("/api/dashboard/calisanlar-ozet", { headers }),
//                         api.get("/api/dashboard/hizli-istatistikler", { headers })
//                     ]);
//                     setCalisanlarOzet(calisanlarRes.data);
//                     setHizliIstatistikler(hizliStatsRes.data);
//                 } catch (err) {
//                     console.warn("Ek admin verileri alınamadı:", err);
//                 }
//             }

//             // Projeler özeti (hem admin hem user için)
//             try {
//                 const projelerRes = await api.get("/api/dashboard/projeler-ozet", { headers });
//                 setProjelerOzet(projelerRes.data);
//             } catch (err) {
//                 console.warn("Projeler özeti alınamadı:", err);
//             }

//             setLoading(false);
//         } catch (err) {
//             console.error("Dashboard API hatası:", err);
//             setError("Dashboard verisi alınamadı: " + (err.response?.data || err.message));
//             setLoading(false);
//         }
//     };
//     // ÇALIŞAN İŞLEMLERİ
//     //     const createEmployee = async () => {
//     //         const ad = window.prompt("Çalışan adı:");
//     //         if (!ad) return;

//     //         const eposta = window.prompt("Email (opsiyonel):") || "";
//     //         const pozisyon = window.prompt("Pozisyon (opsiyonel):") || "";

//     //         try {
//     //             await api.post(
//     //                 "/api/calisanlar",
//     //                 { ad, email: eposta, pozisyon },
//     //                 { headers: authHeaders() }
//     //             );

//     //             alert("Çalışan eklendi ✅");
//     //             await refreshAll();
//     //         } catch (err) {
//     //             alert("Çalışan eklenemedi: " + (err.response?.data || err.message));
//     //         }
//     //     };
//     //     const updateEmployee = async (calisan) => {
//     //         const ad = window.prompt("Yeni ad:", calisan.ad || "");
//     //         if (ad === null) return; // iptal
//     //         const eposta = window.prompt("Yeni email:", calisan.eposta || "") ?? "";
//     //         const pozisyon = window.prompt("Yeni pozisyon:", calisan.pozisyon || "") ?? "";

//     //         try {
//     //             await api.put(`/api/calisanlar/${calisan.id}`, { ad, eposta, pozisyon }, { headers: authHeaders() });
//     //             alert("Çalışan güncellendi ✅");
//     //             await refreshAll();
//     //         } catch (err) {
//     //             alert("Güncelleme hatası: " + (err.response?.data || err.message));
//     //         }
//     //     };

//     //     const deleteEmployee = async (calisanId) => {
//     //         if (!window.confirm("Bu çalışan silinsin mi?")) return;
//     //         try {
//     //             await api.delete(`/api/calisanlar/${calisanId}`, { headers: authHeaders() });
//     //             alert("Çalışan silindi 🗑️");
//     //             await refreshAll();
//     //         } catch (err) {
//     //             alert("Silme hatası: " + (err.response?.data || err.message));
//     //         }
//     //     };

//     //     const addEmployeeToProject = async (calisanId) => {
//     //         const projeId = window.prompt("Hangi proje ID'sine eklensin?");
//     //         if (!projeId) return;
//     //         try {
//     //             await api.post(`/api/projeler/${projeId}/calisanlar/${calisanId}`, null, { headers: authHeaders() });
//     //             alert("Çalışan projeye eklendi ✅");
//     //             await refreshAll();
//     //         } catch (err) {
//     //             alert("Ekleme hatası: " + (err.response?.data || err.message));
//     //         }
//     //     };

//     //     const removeEmployeeFromProject = async (calisanId) => {
//     //         const projeId = window.prompt("Hangi proje ID'sinden çıkarılsın?");
//     //         if (!projeId) return;
//     //         try {
//     //             await api.delete(`/api/projeler/${projeId}/calisanlar/${calisanId}`, { headers: authHeaders() });
//     //             alert("Çalışan projeden çıkarıldı ✅");
//     //             await refreshAll();
//     //         } catch (err) {
//     //             alert("Çıkarma hatası: " + (err.response?.data || err.message));
//     //         }
//     //     };

//     // ---- PROJE İŞLEMLERİ ----
//     // const createProject = async () => {
//     //     const baslik = window.prompt("Proje başlığı:");
//     //     if (!baslik) return;
//     //     const aciklama = window.prompt("Açıklama (opsiyonel):") || "";
//     //     const baslangicTarihi = window.prompt("Başlangıç (YYYY-MM-DD):") || "";
//     //     const bitisTarihi = window.prompt("Bitiş (YYYY-MM-DD):") || "";
//     //     const durum = window.prompt("Durum (DEVAM_EDIYOR / TAMAMLANDI / BEKLEMEDE):") || "DEVAM_EDIYOR";

//     //     try {
//     //         await api.post(
//     //             "/api/projeler",
//     //             { baslik, aciklama, baslangicTarihi, bitisTarihi, durum },
//     //             { headers: authHeaders() }
//     //         );
//     //         alert("Proje eklendi ✅");
//     //         await refreshAll();
//     //     } catch (err) {
//     //         alert("Proje eklenemedi: " + (err.response?.data || err.message));
//     //     }
//     // };

//     // const deleteProject = async (projeId) => {
//     //     if (!window.confirm("Bu proje silinsin mi?")) return;
//     //     try {
//     //         await api.delete(`/api/projeler/${projeId}`, { headers: authHeaders() });
//     //         alert("Proje silindi 🗑️");
//     //         await refreshAll();
//     //     } catch (err) {
//     //         alert("Silme hatası: " + (err.response?.data || err.message));
//     //     }
//     // };

//     // const addEmployeeToThisProject = async (projeId) => {
//     //     const calisanId = window.prompt("Hangi çalışan ID eklensin?");
//     //     if (!calisanId) return;
//     //     try {
//     //         await api.post(`/api/projeler/${projeId}/calisanlar/${calisanId}`, null, { headers: authHeaders() });
//     //         alert("Çalışan projeye eklendi ✅");
//     //         await refreshAll();
//     //     } catch (err) {
//     //         alert("Ekleme hatası: " + (err.response?.data || err.message));
//     //     }
//     // };

//     // const removeEmployeeFromThisProject = async (projeId) => {
//     //     const calisanId = window.prompt("Hangi çalışan ID çıkarılsın?");
//     //     if (!calisanId) return;
//     //     try {
//     //         await api.delete(`/api/projeler/${projeId}/calisanlar/${calisanId}`, { headers: authHeaders() });
//     //         alert("Çalışan projeden çıkarıldı ✅");
//     //         await refreshAll();
//     //     } catch (err) {
//     //         alert("Çıkarma hatası: " + (err.response?.data || err.message));
//     //     }
//     // };
//     const logout = () => {
//         localStorage.removeItem("token");
//         navigate("/");
//     };

//     if (loading) return (
//         <div style={{
//             display: 'flex',
//             justifyContent: 'center',
//             alignItems: 'center',
//             height: '100vh',
//             fontSize: '18px'
//         }}>
//             Yükleniyor...
//         </div>
//     );

//     if (error) return (
//         <div style={{
//             color: "red",
//             padding: '20px',
//             backgroundColor: '#ffe6e6',
//             margin: '20px',
//             borderRadius: '8px',
//             border: '1px solid #ffcccc'
//         }}>
//             <strong>Hata:</strong> {error}
//         </div>
//     );

//     const StatCard = ({ title, value, color = "#3498db" }) => (
//         <div style={{
//             backgroundColor: color,
//             color: 'white',
//             padding: '20px',
//             borderRadius: '8px',
//             textAlign: 'center',
//             minWidth: '150px',
//             margin: '10px'
//         }}>
//             <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', opacity: 0.9 }}>{title}</h3>
//             <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>{value}</p>
//         </div>
//     );

//     const DurumBadge = ({ durum }) => {
//         const colors = {
//             'DEVAM_EDIYOR': { bg: '#e3f2fd', color: '#1976d2' },
//             'TAMAMLANDI': { bg: '#e8f5e8', color: '#388e3c' },
//             'ARA_VERILDI': { bg: '#fff3e0', color: '#f57c00' },
//             'BELIRTILMEMIS': { bg: '#f5f5f5', color: '#757575' }
//         };
//         const style = colors[durum] || colors['BELIRTILMEMIS'];

//         return (
//             <span style={{
//                 backgroundColor: style.bg,
//                 color: style.color,
//                 padding: '4px 8px',
//                 borderRadius: '12px',
//                 fontSize: '12px',
//                 fontWeight: '500'
//             }}>
//                 {durum}
//             </span>
//         );
//     };

//     const renderDashboardContent = () => {
//         if (!dashboardData) return null;

//         return (
//             <div>
//                 <h2 style={h2Style}>📊 Genel Bakış</h2>

//                 {/* İstatistik Kartları */}
//                 {dashboardData.statistics && (
//                     <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '30px' }}>
//                         {role === "ADMIN" ? (
//                             <>
//                                 <StatCard
//                                     title="Toplam Çalışan"
//                                     value={dashboardData.statistics.toplamCalisanSayisi || 0}
//                                     color="#3498db"
//                                 />
//                                 <StatCard
//                                     title="Toplam Proje"
//                                     value={dashboardData.statistics.toplamProjeSayisi || 0}
//                                     color="#2ecc71"
//                                 />
//                                 <StatCard
//                                     title="Devam Eden"
//                                     value={dashboardData.statistics.devamEdenProjeler || 0}
//                                     color="#f39c12"
//                                 />
//                                 <StatCard
//                                     title="Tamamlanan"
//                                     value={dashboardData.statistics.tamamlananProjeler || 0}
//                                     color="#27ae60"
//                                 />
//                             </>
//                         ) : (
//                             <>
//                                 <StatCard
//                                     title="Projelerim"
//                                     value={dashboardData.statistics.projeSayisi || 0}
//                                     color="#3498db"
//                                 />
//                                 <StatCard
//                                     title="Aktif Projeler"
//                                     value={dashboardData.statistics.aktifProjeler || 0}
//                                     color="#f39c12"
//                                 />
//                                 <StatCard
//                                     title="Tamamladığım"
//                                     value={dashboardData.statistics.tamamlananProjeler || 0}
//                                     color="#27ae60"
//                                 />
//                             </>
//                         )}
//                     </div>
//                 )}

//                 {/* Proje Durum Dağılımı */}
//                 {dashboardData.projeDurumDagilimi && (
//                     <div style={{ marginBottom: '30px' }}>
//                         <h3 style={h3Style}>📈 Proje Durum Dağılımı</h3>
//                         <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
//                             {Object.entries(dashboardData.projeDurumDagilimi).map(([durum, sayi]) => (
//                                 <div key={durum} style={{
//                                     border: '1px solid #ddd',
//                                     borderRadius: '8px',
//                                     padding: '15px',
//                                     textAlign: 'center',
//                                     minWidth: '120px'
//                                 }}>
//                                     <DurumBadge durum={durum} />
//                                     <p style={{ margin: '10px 0 0 0', fontSize: '20px', fontWeight: 'bold', color: 'rgba(44, 63, 82, 1)' }}>
//                                         {sayi}
//                                     </p>
//                                 </div>
//                             ))}
//                         </div>
//                     </div>
//                 )}

//                 {/* Son Projeler */}
//                 {dashboardData.sonProjeler && dashboardData.sonProjeler.length > 0 && (
//                     <div style={{ marginBottom: '30px' }}>
//                         <h3 style={h3Style}>🚀 Son Eklenen Projeler</h3>
//                         <div style={{ display: 'grid', gap: '15px' }}>
//                             {dashboardData.sonProjeler.map((proje) => (
//                                 <div key={proje.id} style={{
//                                     border: '1px solid #ddd',
//                                     borderRadius: '8px',
//                                     padding: '15px',
//                                     backgroundColor: '#fafafa'
//                                 }}>
//                                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                                         <h4 style={{ margin: '0 0 5px 0', color: 'rgba(42, 55, 67, 1)' }}>{proje.baslik}</h4>
//                                         <DurumBadge durum={proje.durum} />
//                                     </div>
//                                     <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
//                                         Başlangıç: {formatDate(proje.baslangicTarihi)} | Bitiş: {formatDate(proje.bitisTarihi)}
//                                     </p>
//                                     <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
//                                         Çalışan Sayısı: {proje.calisanlar?.length || 0}
//                                     </p>
//                                 </div>
//                             ))}
//                         </div>
//                     </div>
//                 )}

//                 {/* Kullanıcının Projeleri */}
//                 {dashboardData.benimProjelerim && dashboardData.benimProjelerim.length > 0 && (
//                     <div style={{ marginBottom: '30px' }}>
//                         <h3>👤 Projelerim</h3>
//                         <div style={{ display: 'grid', gap: '15px' }}>
//                             {dashboardData.benimProjelerim.map((proje) => (
//                                 <div key={proje.id} style={{
//                                     border: '1px solid #ddd',
//                                     borderRadius: '8px',
//                                     padding: '15px',
//                                     backgroundColor: '#f8f9fa'
//                                 }}>
//                                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                                         <h4 style={{ margin: '0 0 5px 0' }}>{proje.ad}</h4>
//                                         <DurumBadge durum={proje.durum} />
//                                     </div>
//                                     <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
//                                         Başlangıç: {proje.baslangicTarihi} | Bitiş: {proje.bitisTarihi}
//                                     </p>
//                                 </div>
//                             ))}
//                         </div>
//                     </div>
//                 )}
//             </div>
//         );
//     };

//     const renderCalisanlarContent = () => {
//         return <Calisanlar calisanlar={calisanlarOzet} />;
//     }
//     //     if (role !== "ADMIN") {
//     //         return (
//     //             <div style={{ textAlign: 'center', padding: '50px' }}>
//     //                 <h3>⚠️ Bu bölüme erişim yetkiniz yok</h3>
//     //                 <p>Çalışanlar bölümü sadece admin kullanıcılar içindir.</p>
//     //             </div>
//     //         );
//     //     }

//     //     if (!calisanlarOzet) {
//     //         return (
//     //             <div style={{ textAlign: 'center', padding: '50px' }}>
//     //                 <h3>📥 Çalışan verileri yükleniyor...</h3>
//     //                 <p>Lütfen bekleyin.</p>
//     //             </div>
//     //         );
//     //     }

//     //     return (
//     //         <div>
//     //             <div style={{ marginBottom: '30px' }}>
//     //                 <h2 style={h2Style}>👥 Çalışanlar Yönetimi</h2>
//     //                 <p style={{ color: '#666', marginBottom: '20px' }}>
//     //                     <strong>Toplam Çalışan:</strong> {calisanlarOzet.toplamCalisanSayisi}
//     //                 </p>
//     //                 <button
//     //                     onClick={createEmployee}
//     //                     style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #3498db', background: '#3498db', color: 'white', cursor: 'pointer', marginBottom: 14 }}
//     //                 >
//     //                     + Yeni Çalışan
//     //                 </button>
//     //             </div>

//     //             {/* Çalışan İstatistikleri */}
//     //             <div style={{ marginBottom: '30px' }}>
//     //                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
//     //                     <StatCard
//     //                         title="Toplam Çalışan"
//     //                         value={calisanlarOzet.toplamCalisanSayisi || 0}
//     //                         color="#3498db"
//     //                     />
//     //                     {calisanlarOzet.calisanProjeSayilari && (
//     //                         <StatCard
//     //                             title="Ortalama Proje/Kişi"
//     //                             value={Math.round(
//     //                                 Object.values(calisanlarOzet.calisanProjeSayilari).reduce((a, b) => a + b, 0) /
//     //                                 Object.keys(calisanlarOzet.calisanProjeSayilari).length * 10
//     //                             ) / 10 || 0}
//     //                             color="#9b59b6"
//     //                         />
//     //                     )}
//     //                 </div>
//     //             </div>

//     //             {/* Çalışan Listesi */}
//     //             {calisanlarOzet.calisanlar && calisanlarOzet.calisanlar.length > 0 ? (
//     //                 <div>

//     //                     <h3 style={h3Style}>📋 Tüm Çalışanlar</h3>
//     //                     <div style={{
//     //                         display: 'grid',
//     //                         gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
//     //                         gap: '20px'
//     //                     }}>
//     //                         {calisanlarOzet.calisanlar.map((calisan, index) => (
//     //                             <div key={calisan.id || index} style={{
//     //                                 border: '1px solid #e1e8ed',
//     //                                 borderRadius: '12px',
//     //                                 padding: '20px',
//     //                                 backgroundColor: 'white',
//     //                                 boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//     //                                 transition: 'transform 0.2s ease, box-shadow 0.2s ease',
//     //                                 cursor: 'pointer'
//     //                             }}
//     //                                 onMouseEnter={(e) => {
//     //                                     e.target.style.transform = 'translateY(-2px)';
//     //                                     e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
//     //                                 }}
//     //                                 onMouseLeave={(e) => {
//     //                                     e.target.style.transform = 'translateY(0)';
//     //                                     e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
//     //                                 }}
//     //                             >
//     //                                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
//     //                                     <div style={{ flex: 1 }}>
//     //                                         <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
//     //                                             <div style={{
//     //                                                 width: '40px',
//     //                                                 height: '40px',
//     //                                                 borderRadius: '50%',
//     //                                                 backgroundColor: '#3498db',
//     //                                                 display: 'flex',
//     //                                                 alignItems: 'center',
//     //                                                 justifyContent: 'center',
//     //                                                 color: 'white',
//     //                                                 fontWeight: 'bold',
//     //                                                 fontSize: '16px',
//     //                                                 marginRight: '12px'
//     //                                             }}>
//     //                                                 {calisan.ad ? calisan.ad.charAt(0).toUpperCase() : '?'}
//     //                                             </div>
//     //                                             <div>
//     //                                                 <h4 style={{ margin: '0', fontSize: '18px', color: '#2c3e50' }}>
//     //                                                     {calisan.ad || 'İsim Belirtilmemiş'}
//     //                                                 </h4>
//     //                                                 <p style={{ margin: '2px 0 0 0', color: '#7f8c8d', fontSize: '14px' }}>
//     //                                                     ID: {calisan.id}
//     //                                                 </p>
//     //                                             </div>
//     //                                         </div>
//     //                                     </div>
//     //                                     <div style={{
//     //                                         backgroundColor: '#3498db',
//     //                                         color: 'white',
//     //                                         padding: '6px 12px',
//     //                                         borderRadius: '20px',
//     //                                         fontSize: '12px',
//     //                                         fontWeight: '600'
//     //                                     }}>
//     //                                         {calisanlarOzet.calisanProjeSayilari?.[calisan.id] || 0} proje
//     //                                     </div>
//     //                                 </div>

//     //                                 <div style={{ marginBottom: '10px' }}>
//     //                                     <p style={{ margin: '0', color: '#34495e', fontSize: '16px', fontWeight: '500' }}>
//     //                                         🏢 {calisan.pozisyon || 'Pozisyon Belirtilmemiş'}
//     //                                     </p>
//     //                                 </div>

//     //                                 <div style={{ borderTop: '1px solid #ecf0f1', paddingTop: '15px' }}>
//     //                                     <p style={{ margin: '0 0 8px 0', color: '#7f8c8d', fontSize: '14px' }}>
//     //                                         📧 {calisan.email || 'Email Belirtilmemiş'}
//     //                                     </p>
//     //                                     <p style={{ margin: '0', color: '#7f8c8d', fontSize: '14px' }}>
//     //                                         📞 {calisan.telefon || 'Telefon Belirtilmemiş'}
//     //                                     </p>
//     //                                 </div>
//     //                                 <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
//     //                                     <button
//     //                                         onClick={() => updateEmployee(calisan)}
//     //                                         style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #3498db', background: '#3498db', color: 'white', cursor: 'pointer' }}
//     //                                     >
//     //                                         Düzenle
//     //                                     </button>
//     //                                     <button
//     //                                         onClick={() => deleteEmployee(calisan.id)}
//     //                                         style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e74c3c', background: '#e74c3c', color: 'white', cursor: 'pointer' }}
//     //                                     >
//     //                                         Sil
//     //                                     </button>
//     //                                     <button
//     //                                         onClick={() => addEmployeeToProject(calisan.id)}
//     //                                         style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #2ecc71', background: '#2ecc71', color: 'white', cursor: 'pointer' }}
//     //                                     >
//     //                                         Projeye Ekle
//     //                                     </button>
//     //                                     <button
//     //                                         onClick={() => removeEmployeeFromProject(calisan.id)}
//     //                                         style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #f39c12', background: '#f39c12', color: 'white', cursor: 'pointer' }}
//     //                                     >
//     //                                         Projeden Çıkar
//     //                                     </button>
//     //                                 </div>


//     //                             </div>
//     //                         ))}
//     //                     </div>
//     //                 </div>
//     //             ) : (
//     //                 <div style={{
//     //                     textAlign: 'center',
//     //                     padding: '50px',
//     //                     backgroundColor: 'white',
//     //                     borderRadius: '12px',
//     //                     border: '1px solid #e1e8ed'
//     //                 }}>
//     //                     <h3 style={{ color: '#7f8c8d' }}>📭 Henüz çalışan bulunmuyor</h3>
//     //                     <p style={{ color: '#bdc3c7' }}>Sisteme çalışan eklendikçe burada görünecektir.</p>
//     //                 </div>
//     //             )}
//     //         </div>
//     //     );
//     // };

//     const renderProjelerContent = () => {
//         return <Projeler projeler={projelerOzet} />;
//     }
//     //     if (!projelerOzet) {
//     //         return (
//     //             <div style={{ textAlign: 'center', padding: '50px' }}>
//     //                 <h3>📥 Proje verileri yükleniyor...</h3>
//     //                 <p>Lütfen bekleyin.</p>
//     //             </div>
//     //         );
//     //     }

//     //     return (
//     //         <div>
//     //             <div style={{ marginBottom: '30px' }}>
//     //                 <h2 style={h2Style}>📋 Projeler Yönetimi</h2>
//     //                 <p style={{ color: '#666', marginBottom: '20px' }}>
//     //                     <strong>Toplam Proje:</strong> {projelerOzet.toplamProjeSayisi}
//     //                 </p>
//     //                 <button
//     //                     onClick={createProject}
//     //                     style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #064f09ff', background: '#064f09ff', color: 'white', cursor: 'pointer', marginBottom: 14 }}
//     //                 >
//     //                     + Yeni Proje
//     //                 </button>
//     //             </div>

//     //             {/* Proje İstatistikleri */}
//     //             <div style={{ marginBottom: '30px' }}>
//     //                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
//     //                     <StatCard
//     //                         title="Toplam Proje"
//     //                         value={projelerOzet.toplamProjeSayisi || 0}
//     //                         color="#2ecc71"
//     //                     />
//     //                     {projelerOzet.durumDagilimi && (
//     //                         <>
//     //                             <StatCard
//     //                                 title="Devam Eden"
//     //                                 value={projelerOzet.durumDagilimi['DEVAM_EDIYOR'] || 0}
//     //                                 color="#f39c12"
//     //                             />
//     //                             <StatCard
//     //                                 title="Tamamlanan"
//     //                                 value={projelerOzet.durumDagilimi['TAMAMLANDI'] || 0}
//     //                                 color="#27ae60"
//     //                             />
//     //                             <StatCard
//     //                                 title="Beklemede"
//     //                                 value={projelerOzet.durumDagilimi['BEKLEMEDE'] || 0}
//     //                                 color="#e67e22"
//     //                             />
//     //                         </>
//     //                     )}
//     //                 </div>
//     //             </div>

//     //             {/* Durum Dağılımı */}
//     //             {projelerOzet.durumDagilimi && Object.keys(projelerOzet.durumDagilimi).length > 0 && (
//     //                 <div style={{ marginBottom: '30px' }}>
//     //                     <h3 style={h3Style}>📊 Proje Durum Dağılımı</h3>
//     //                     <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
//     //                         {Object.entries(projelerOzet.durumDagilimi).map(([durum, sayi]) => (
//     //                             <div key={durum} style={{
//     //                                 border: '1px solid #e1e8ed',
//     //                                 borderRadius: '12px',
//     //                                 padding: '20px',
//     //                                 textAlign: 'center',
//     //                                 minWidth: '150px',
//     //                                 backgroundColor: 'white',
//     //                                 boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
//     //                             }}>
//     //                                 <DurumBadge durum={durum} />
//     //                                 <p style={{ margin: '15px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: '#2c3e50' }}>
//     //                                     {sayi}
//     //                                 </p>
//     //                                 <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#7f8c8d' }}>
//     //                                     proje
//     //                                 </p>
//     //                             </div>
//     //                         ))}
//     //                     </div>
//     //                 </div>
//     //             )}

//     //             {/* Proje Listesi */}
//     //             {projelerOzet.projeler && projelerOzet.projeler.length > 0 ? (
//     //                 <div>

//     //                     <h3 style={h3Style}>🚀 Tüm Projeler</h3>
//     //                     <div style={{
//     //                         display: 'grid',
//     //                         gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
//     //                         gap: '20px'
//     //                     }}>
//     //                         {projelerOzet.projeler.map((proje, index) => (
//     //                             <div key={proje.id || index} style={{
//     //                                 border: '1px solid #e1e8ed',
//     //                                 borderRadius: '12px',
//     //                                 padding: '20px',
//     //                                 backgroundColor: 'white',
//     //                                 boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//     //                                 transition: 'transform 0.2s ease, box-shadow 0.2s ease',
//     //                                 cursor: 'pointer'
//     //                             }}
//     //                                 onMouseEnter={(e) => {
//     //                                     e.target.style.transform = 'translateY(-2px)';
//     //                                     e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
//     //                                 }}
//     //                                 onMouseLeave={(e) => {
//     //                                     e.target.style.transform = 'translateY(0)';
//     //                                     e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
//     //                                 }}
//     //                             >
//     //                                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
//     //                                     <div style={{ flex: 1 }}>
//     //                                         <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#2c3e50' }}>
//     //                                             📁 {proje.baslik || 'Proje Adı Belirtilmemiş'}
//     //                                         </h4>
//     //                                         <p style={{ margin: '0', color: '#7f8c8d', fontSize: '14px' }}>
//     //                                             ID: {proje.id}
//     //                                         </p>
//     //                                     </div>
//     //                                     <DurumBadge durum={proje.durum || 'BELIRTILMEMIS'} />
//     //                                 </div> 
//     //                                 <div style={{ marginBottom: '15px' }}>
//     //                                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
//     //                                         <span style={{ color: '#34495e', fontSize: '14px' }}>
//     //                                             📅 Başlangıç:
//     //                                         </span>
//     //                                         <span style={{ fontWeight: '500', color: '#2c3e50', fontSize: '14px' }}>
//     //                                             {formatDate(proje.baslangicTarihi)}
//     //                                         </span>
//     //                                     </div>
//     //                                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
//     //                                         <span style={{ color: '#34495e', fontSize: '14px' }}>
//     //                                             🏁 Bitiş:
//     //                                         </span>
//     //                                         <span style={{ fontWeight: '500', color: '#2c3e50', fontSize: '14px' }}>
//     //                                             {formatDate(proje.bitisTarihi)}
//     //                                         </span>
//     //                                     </div>
//     //                                     <div style={{ display: 'flex', justifyContent: 'space-between' }}>
//     //                                         <span style={{ color: '#34495e', fontSize: '14px' }}>
//     //                                             👥 Çalışan Sayısı:
//     //                                         </span>
//     //                                         <span style={{
//     //                                             fontWeight: '500',
//     //                                             color: '#2c3e50',
//     //                                             fontSize: '14px',
//     //                                             backgroundColor: '#ecf0f1',
//     //                                             padding: '2px 8px',
//     //                                             borderRadius: '10px'
//     //                                         }}>
//     //                                             {proje.calisanlar?.length || 0} kişi
//     //                                         </span>
//     //                                     </div>
//     //                                 </div>
//     //                                 {/* Proje Açıklaması varsa */}
//     //                                 {proje.aciklama && (
//     //                                     <div style={{
//     //                                         borderTop: '1px solid #ecf0f1',
//     //                                         paddingTop: '15px',
//     //                                         marginTop: '15px'
//     //                                     }}>
//     //                                         <p style={{ margin: '0', color: '#7f8c8d', fontSize: '14px', fontStyle: 'italic' }}>
//     //                                             💬 {proje.aciklama}
//     //                                         </p>
//     //                                     </div>
//     //                                 )}

//     //                                 {/* Çalışan isimleri varsa (ilk 3'ü göster) */}
//     //                                 {proje.calisanlar && proje.calisanlar.length > 0 && (
//     //                                     <div style={{
//     //                                         borderTop: '1px solid #ecf0f1',
//     //                                         paddingTop: '15px',
//     //                                         marginTop: '15px'
//     //                                     }}>
//     //                                         <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#7f8c8d', fontWeight: '500' }}>
//     //                                             Çalışanlar:
//     //                                         </p>
//     //                                         <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
//     //                                             {proje.calisanlar.slice(0, 3).map((calisan, idx) => (
//     //                                                 <span key={idx} style={{
//     //                                                     backgroundColor: '#3498db',
//     //                                                     color: 'white',
//     //                                                     padding: '3px 8px',
//     //                                                     borderRadius: '12px',
//     //                                                     fontSize: '11px',
//     //                                                     fontWeight: '500'
//     //                                                 }}>
//     //                                                     {calisan.ad || `Çalışan ${idx + 1}`}
//     //                                                 </span>
//     //                                             ))}
//     //                                             {proje.calisanlar.length > 3 && (
//     //                                                 <span style={{
//     //                                                     backgroundColor: '#95a5a6',
//     //                                                     color: 'white',
//     //                                                     padding: '3px 8px',
//     //                                                     borderRadius: '12px',
//     //                                                     fontSize: '11px',
//     //                                                     fontWeight: '500'
//     //                                                 }}>
//     //                                                     +{proje.calisanlar.length - 3} daha
//     //                                                 </span>
//     //                                             )}
//     //                                         </div>
//     //                                     </div>
//     //                                 )}
//     //                                 <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
//     //                                     <button
//     //                                         onClick={() => addEmployeeToThisProject(proje.id)}
//     //                                         style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #2ecc71', background: '#2ecc71', color: 'white', cursor: 'pointer' }}
//     //                                     >
//     //                                         Çalışan Ekle
//     //                                     </button>

//     //                                     <button
//     //                                         onClick={() => removeEmployeeFromThisProject(proje.id)}
//     //                                         style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #f39c12', background: '#f39c12', color: 'white', cursor: 'pointer' }}
//     //                                     >
//     //                                         Çalışan Çıkar
//     //                                     </button>

//     //                                     {role === "ADMIN" && (
//     //                                         <button
//     //                                             onClick={() => deleteProject(proje.id)}
//     //                                             style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e74c3c', background: '#e74c3c', color: 'white', cursor: 'pointer' }}
//     //                                         >
//     //                                             Projeyi Sil
//     //                                         </button>
//     //                                     )}
//     //                                 </div>

//     //                             </div>
//     //                         ))}
//     //                     </div>
//     //                 </div>
//     //             ) : (
//     //                 <div style={{
//     //                     textAlign: 'center',
//     //                     padding: '50px',
//     //                     backgroundColor: 'white',
//     //                     borderRadius: '12px',
//     //                     border: '1px solid #e1e8ed'
//     //                 }}>
//     //                     <h3 style={{ color: '#7f8c8d' }}>📭 Henüz proje bulunmuyor</h3>
//     //                     <p style={{ color: '#bdc3c7' }}>
//     //                         {role === "ADMIN"
//     //                             ? "Sisteme proje eklendikçe burada görünecektir."
//     //                             : "Size atanan projeler burada görünecektir."
//     //                         }
//     //                     </p>
//     //                 </div>
//     //             )}
//     //         </div>
//     //     );
//     // };
//     // return (
//     //   <div style={{
//     //     minHeight: '100vh',
//     //   backgroundColor: '#f5f6fa',
//     // margin: 0,
//     // padding: 0,
//     //         width: '100vw',
//     //         overflowX: 'hidden'
//     //     }}>
//     //         {/* Header */}
//     //         <div style={{
//     //             backgroundColor: 'white',
//     //             boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
//     //             padding: '15px 20px',
//     //             marginBottom: '20px',
//     //             width: '100%',
//     //             boxSizing: 'border-box'
//     //         }}>
//     //             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//     //                 <div>
//     //                     <h1 style={{ margin: '0', fontSize: '24px', color: '#2c3e50' }}>
//     //                         {role === "ADMIN" ? "🔧 Admin Anasayfası" : "👤 Kullanıcı Anasayfası"}
//     //                     </h1>
//     //                     <p style={{ margin: '5px 0 0 0', color: '#7f8c8d' }}>
//     //                         Hoş geldin, <strong>{username}</strong>
//     //                     </p>
//     //                 </div>
//     //                 <button
//     //                     onClick={logout}
//     //                     style={{
//     //                         padding: "10px 20px",
//     //                         backgroundColor: "#e74c3c",
//     //                         color: "white",
//     //                         border: "none",
//     //                         borderRadius: "6px",
//     //                         cursor: "pointer",
//     //                         fontSize: "14px",
//     //                         fontWeight: "500"
//     //                     }}
//     //                     onMouseOver={(e) => e.target.style.backgroundColor = "#c0392b"}
//     //                     onMouseOut={(e) => e.target.style.backgroundColor = "#e74c3c"}
//     //                 >
//     //                     🚪 Çıkış Yap
//     //                 </button>
//     //             </div>
//     //         </div>
//     //         <div style={{ padding: '0 20px', width: '100%', boxSizing: 'border-box' }}>
//     //             {/* Navigation Tabs */}
//     //             <div style={{ marginBottom: '30px' }}>
//     //                 <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #ddd' }}>
//     //                     <button
//     //                         onClick={() => setActiveTab("dashboard")}
//     //                         style={{
//     //                             padding: "12px 24px",
//     //                             backgroundColor: activeTab === "dashboard" ? "#3498db" : "transparent",
//     //                             color: activeTab === "dashboard" ? "white" : "#3498db",
//     //                             border: "none",
//     //                             borderRadius: "6px 6px 0 0",
//     //                             cursor: "pointer",
//     //                             fontSize: "14px",
//     //                             fontWeight: "500",
//     //                             borderBottom: activeTab === "dashboard" ? "3px solid #2980b9" : "none"
//     //                         }}
//     //                     >
//     //                         📊 Dashboard
//     //                     </button>

//     //                     {role === "ADMIN" && (
//     //                         <button
//     //                             onClick={() => setActiveTab("calisanlar")}
//     //                             style={{
//     //                                 padding: "12px 24px",
//     //                                 backgroundColor: activeTab === "calisanlar" ? "#2ecc71" : "transparent",
//     //                                 color: activeTab === "calisanlar" ? "white" : "#2ecc71",
//     //                                 border: "none",
//     //                                 borderRadius: "6px 6px 0 0",
//     //                                 cursor: "pointer",
//     //                                 fontSize: "14px",
//     //                                 fontWeight: "500",
//     //                                 borderBottom: activeTab === "calisanlar" ? "3px solid #27ae60" : "none"
//     //                             }}
//     //                         >
//     //                             👥 Çalışanlar
//     //                         </button>
//     //                     )}

//     //                     <button
//     //                         onClick={() => setActiveTab("projeler")}
//     //                         style={{
//     //                             padding: "12px 24px",
//     //                             backgroundColor: activeTab === "projeler" ? "#f39c12" : "transparent",
//     //                             color: activeTab === "projeler" ? "white" : "#f39c12",
//     //                             border: "none",
//     //                             borderRadius: "6px 6px 0 0",
//     //                             cursor: "pointer",
//     //                             fontSize: "14px",
//     //                             fontWeight: "500",
//     //                             borderBottom: activeTab === "projeler" ? "3px solid #e67e22" : "none"
//     //                         }}
//     //                     >
//     //                         📋 Projeler
//     //                     </button>
//     //                 </div>
//     //             </div>

//     //             {/* Content */}
//     //             <div style={{
//     //                 backgroundColor: 'white',
//     //                 borderRadius: '8px',
//     //                 padding: '30px',
//     //                 boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
//     //                 minHeight: '500px',
//     //                 width: '100%',
//     //                 boxSizing: 'border-box'
//     //             }}>
//     //                 {activeTab === "dashboard" && renderDashboardContent()}
//     //                 {activeTab === "calisanlar" && renderCalisanlarContent()}
//     //                 {activeTab === "projeler" && renderProjelerContent()}
//     //             </div>

//     //             {/* Footer Info */}
//     //             {dashboardData && (
//     //                 <div style={{
//     //                     textAlign: 'center',
//     //                     padding: '20px',
//     //                     color: '#7f8c8d',
//     //                     fontSize: '12px'
//     //                 }}>
//     //                     Son güncelleme: {new Date(dashboardData.timestamp).toLocaleString('tr-TR')}
//     //                 </div>
//     //             )}
//     //         </div>
//     //     </div>
//     // );
// }

import React, { useEffect, useState } from "react";
import axios from "axios";
import jwt_decode from 'jwt-decode';
import { useNavigate } from "react-router-dom";
import api from "../api";
import Calisanlar from "../pages/Calisanlar.jsx";
import Projeler from "../pages/Projeler.jsx";

export default function Dashboard() {
    const [role, setRole] = useState(null);
    const [username, setUsername] = useState("");
    const [dashboardData, setDashboardData] = useState(null);
    const [calisanlarOzet, setCalisanlarOzet] = useState(null);
    const [projelerOzet, setProjelerOzet] = useState(null);
    const [hizliIstatistikler, setHizliIstatistikler] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("dashboard");
    const navigate = useNavigate();
    const [rolesState, setRolesState] = useState([]);

    // ortak başlık renkleri
    const headingGray = '#6b7280'; // Tailwind karşılığı: text-gray-500
    const h2Style = { color: headingGray, margin: '0 0 12px 0' };
    const h3Style = { color: headingGray, margin: '0 0 10px 0' };

    const authHeaders = () => ({
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    });

    const formatDate = (val) => {
        if (!val) return 'Belirtilmemiş';
        const d = new Date(val);
        if (isNaN(d.getTime())) return String(val); // backenden string geldiyse
        return d.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const refreshAll = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;
            await fetchDashboardData(token, rolesState);
        } catch (e) {
            console.error("Yenileme hatası:", e);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        console.log("Token:", token);
        if (!token) {
            navigate("/");
            return;
        }

        try {
            // Token'ı decode edilmesi
            const decoded = jwt_decode(token);
            console.log("Decoded token:", decoded);
            const roles = decoded.roles || [];
            setUsername(decoded.sub || "");
            setRolesState(roles);

            if (roles.includes("ROLE_ADMIN")) setRole("ADMIN");
            else if (roles.includes("ROLE_USER")) setRole("USER");
            else setRole("UNKNOWN");

            // Dashboard verisini çek
            fetchDashboardData(token, roles);
        } catch (e) {
            console.error("Token decode hatası", e);
            localStorage.removeItem("token");
            navigate("/");
        }
    }, [navigate]);

    const fetchDashboardData = async (token, roles) => {
        const headers = { Authorization: `Bearer ${token}` };
        const isAdmin = roles.includes("ROLE_ADMIN");

        try {
            // Ana dashboard verisi
            const dashboardRes = await api.get("/api/dashboard", { headers });
            setDashboardData(dashboardRes.data);

            // Admin ise ek veriler çek
            if (isAdmin) {
                try {
                    const [calisanlarRes, hizliStatsRes] = await Promise.all([
                        api.get("/api/dashboard/calisanlar-ozet", { headers }),
                        api.get("/api/dashboard/hizli-istatistikler", { headers })
                    ]);
                    setCalisanlarOzet(calisanlarRes.data);
                    setHizliIstatistikler(hizliStatsRes.data);
                } catch (err) {
                    console.warn("Ek admin verileri alınamadı:", err);
                }
            }

            // Projeler özeti (hem admin hem user için)
            try {
                const projelerRes = await api.get("/api/dashboard/projeler-ozet", { headers });
                setProjelerOzet(projelerRes.data);
            } catch (err) {
                console.warn("Projeler özeti alınamadı:", err);
            }

            setLoading(false);
        } catch (err) {
            console.error("Dashboard API hatası:", err);
            setError("Dashboard verisi alınamadı: " + (err.response?.data || err.message));
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    if (loading) return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            fontSize: '18px'
        }}>
            Yükleniyor...
        </div>
    );

    if (error) return (
        <div style={{
            color: "red",
            padding: '20px',
            backgroundColor: '#ffe6e6',
            margin: '20px',
            borderRadius: '8px',
            border: '1px solid #ffcccc'
        }}>
            <strong>Hata:</strong> {error}
        </div>
    );

    const StatCard = ({ title, value, color = "#3498db" }) => (
        <div style={{
            backgroundColor: color,
            color: 'white',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center',
            minWidth: '150px',
            margin: '10px'
        }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', opacity: 0.9 }}>{title}</h3>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>{value}</p>
        </div>
    );

    const DurumBadge = ({ durum }) => {
        const colors = {
            'DEVAM_EDIYOR': { bg: '#e3f2fd', color: '#1976d2' },
            'TAMAMLANDI': { bg: '#e8f5e8', color: '#388e3c' },
            'ARA_VERILDI': { bg: '#fff3e0', color: '#f57c00' },
            'BELIRTILMEMIS': { bg: '#f5f5f5', color: '#757575' }
        };
        const style = colors[durum] || colors['BELIRTILMEMIS'];
        return (
            <span style={{
                backgroundColor: style.bg,
                color: style.color,
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500'
            }}>
                {durum}
            </span>
        );
    };

    const renderDashboardContent = () => {
        if (!dashboardData) return null;

        return (
            <div>
                <h2 style={h2Style}>📊 Genel Bakış</h2>
                {/* İstatistik Kartları */}
                {dashboardData.statistics && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '30px' }}>
                        {role === "ADMIN" ? (
                            <>
                                <StatCard title="Toplam Çalışan" value={dashboardData.statistics.toplamCalisanSayisi || 0} color="#3498db" />
                                <StatCard title="Toplam Proje" value={dashboardData.statistics.toplamProjeSayisi || 0} color="#2ecc71" />
                                <StatCard title="Devam Eden" value={dashboardData.statistics.devamEdenProjeler || 0} color="#f39c12" />
                                <StatCard title="Tamamlanan" value={dashboardData.statistics.tamamlananProjeler || 0} color="#27ae60" />
                            </>
                        ) : (
                            <>
                                <StatCard title="Projelerim" value={dashboardData.statistics.projeSayisi || 0} color="#3498db" />
                                <StatCard title="Aktif Projeler" value={dashboardData.statistics.aktifProjeler || 0} color="#f39c12" />
                                <StatCard title="Tamamladığım" value={dashboardData.statistics.tamamlananProjeler || 0} color="#27ae60" />
                            </>
                        )}
                    </div>
                )}

                {/* Proje Durum Dağılımı */}
                {dashboardData.projeDurumDagilimi && (
                    <div style={{ marginBottom: '30px' }}>
                        <h3 style={h3Style}>📈 Proje Durum Dağılımı</h3>
                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                            {Object.entries(dashboardData.projeDurumDagilimi).map(([durum, sayi]) => (
                                <div key={durum} style={{
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    padding: '15px',
                                    textAlign: 'center',
                                    minWidth: '120px'
                                }}>
                                    <DurumBadge durum={durum} />
                                    <p style={{ margin: '10px 0 0 0', fontSize: '20px', fontWeight: 'bold', color: 'rgba(44, 63, 82, 1)' }}>
                                        {sayi}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Son Projeler */}
                {dashboardData.sonProjeler && dashboardData.sonProjeler.length > 0 && (
                    <div style={{ marginBottom: '30px' }}>
                        <h3 style={h3Style}>🚀 Son Eklenen Projeler</h3>
                        <div style={{ display: 'grid', gap: '15px' }}>
                            {dashboardData.sonProjeler.map((proje) => (
                                <div key={proje.id} style={{
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    padding: '15px',
                                    backgroundColor: '#fafafa'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h4 style={{ margin: '0 0 5px 0', color: 'rgba(42, 55, 67, 1)' }}>{proje.baslik}</h4>
                                        <DurumBadge durum={proje.durum} />
                                    </div>
                                    <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                                        Başlangıç: {formatDate(proje.baslangicTarihi)} | Bitiş: {formatDate(proje.bitisTarihi)}
                                    </p>
                                    <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                                        Çalışan Sayısı: {proje.calisanlar?.length || 0}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Kullanıcının Projeleri */}
                {dashboardData.benimProjelerim && dashboardData.benimProjelerim.length > 0 && (
                    <div style={{ marginBottom: '30px' }}>
                        <h3 style={h3Style}>👤 Projelerim</h3>
                        <div style={{ display: 'grid', gap: '15px' }}>
                            {dashboardData.benimProjelerim.map((proje) => (
                                <div key={proje.id} style={{
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    padding: '15px',
                                    backgroundColor: '#f8f9fa'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h4 style={{ margin: '0 0 5px 0' }}>{proje.ad}</h4>
                                        <DurumBadge durum={proje.durum} />
                                    </div>
                                    <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                                        Başlangıç: {proje.baslangicTarihi} | Bitiş: {proje.bitisTarihi}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderCalisanlarContent = () => {
        return (
            <Calisanlar
                calisanlarOzet={calisanlarOzet}
                role={role}
                authHeaders={authHeaders}
                refreshAll={refreshAll}
                h2Style={h2Style}
                h3Style={h3Style}
                StatCard={StatCard}
                formatDate={formatDate}
                api={api}
            />
        );
    };

    const renderProjelerContent = () => {
        return (
            <Projeler
                projelerOzet={projelerOzet}
                role={role}
                authHeaders={authHeaders}
                refreshAll={refreshAll}
                h2Style={h2Style}
                h3Style={h3Style}
                StatCard={StatCard}
                DurumBadge={DurumBadge}
                formatDate={formatDate}
                api={api}
            />
        );
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#f5f6fa',
            margin: 0,
            padding: 0,
            width: '100vw',
            overflowX: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                backgroundColor: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                padding: '15px 20px',
                marginBottom: '20px',
                width: '100%',
                boxSizing: 'border-box'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ margin: '0', fontSize: '24px', color: '#2c3e50' }}>
                            {role === "ADMIN" ? "🔧 Admin Anasayfası" : "👤 Kullanıcı Anasayfası"}
                        </h1>
                        <p style={{ margin: '5px 0 0 0', color: '#7f8c8d' }}>
                            Hoş geldin, <strong>{username}</strong>
                        </p>
                    </div>
                    <button
                        onClick={logout}
                        style={{
                            padding: "10px 20px",
                            backgroundColor: "#e74c3c",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "500"
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = "#c0392b"}
                        onMouseOut={(e) => e.target.style.backgroundColor = "#e74c3c"}
                    >
                        🚪 Çıkış Yap
                    </button>
                </div>
            </div>

            <div style={{ padding: '0 20px', width: '100%', boxSizing: 'border-box' }}>
                {/* Navigation Tabs */}
                <div style={{ marginBottom: '30px' }}>
                    <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #ddd' }}>
                        <button
                            onClick={() => setActiveTab("dashboard")}
                            style={{
                                padding: "12px 24px",
                                backgroundColor: activeTab === "dashboard" ? "#3498db" : "transparent",
                                color: activeTab === "dashboard" ? "white" : "#3498db",
                                border: "none",
                                borderRadius: "6px 6px 0 0",
                                cursor: "pointer",
                                fontSize: "14px",
                                fontWeight: "500",
                                borderBottom: activeTab === "dashboard" ? "3px solid #2980b9" : "none"
                            }}
                        >
                            📊 Dashboard
                        </button>

                        {role === "ADMIN" && (
                            <button
                                onClick={() => setActiveTab("calisanlar")}
                                style={{
                                    padding: "12px 24px",
                                    backgroundColor: activeTab === "calisanlar" ? "#2ecc71" : "transparent",
                                    color: activeTab === "calisanlar" ? "white" : "#2ecc71",
                                    border: "none",
                                    borderRadius: "6px 6px 0 0",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    borderBottom: activeTab === "calisanlar" ? "3px solid #27ae60" : "none"
                                }}
                            >
                                👥 Çalışanlar
                            </button>
                        )}

                        <button
                            onClick={() => setActiveTab("projeler")}
                            style={{
                                padding: "12px 24px",
                                backgroundColor: activeTab === "projeler" ? "#f39c12" : "transparent",
                                color: activeTab === "projeler" ? "white" : "#f39c12",
                                border: "none",
                                borderRadius: "6px 6px 0 0",
                                cursor: "pointer",
                                fontSize: "14px",
                                fontWeight: "500",
                                borderBottom: activeTab === "projeler" ? "3px solid #e67e22" : "none"
                            }}
                        >
                            📋 Projeler
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '30px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    minHeight: '500px',
                    width: '100%',
                    boxSizing: 'border-box'
                }}>
                    {activeTab === "dashboard" && renderDashboardContent()}
                    {activeTab === "calisanlar" && renderCalisanlarContent()}
                    {activeTab === "projeler" && renderProjelerContent()}
                </div>

                {/* Footer Info */}
                {dashboardData && (
                    <div style={{
                        textAlign: 'center',
                        padding: '20px',
                        color: '#7f8c8d',
                        fontSize: '12px'
                    }}>
                        Son güncelleme: {new Date(dashboardData.timestamp).toLocaleString('tr-TR')}
                    </div>
                )}
            </div>
        </div>
    );
}