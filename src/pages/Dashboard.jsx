import React, { useEffect, useState } from "react";
import jwt_decode from "jwt-decode";
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

    const headingGray = "#6b7280";
    const h2Style = { color: headingGray, margin: "0 0 12px 0" };
    const h3Style = { color: headingGray, margin: "0 0 10px 0" };

    const authHeaders = () => ({
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    });

    const formatDate = (val) => {
        if (!val) return "Belirtilmemiş";
        const d = new Date(val);
        if (isNaN(d.getTime())) return String(val);
        return d.toLocaleDateString("tr-TR", {
            year: "numeric",
            month: "long",
            day: "numeric",
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
        if (!token) {
            navigate("/");
            return;
        }

        try {
            const decoded = jwt_decode(token);
            const roles = decoded.roles || [];
            setUsername(decoded.sub || "");
            setRolesState(roles);

            if (roles.includes("ROLE_ADMIN")) setRole("ADMIN");
            else if (roles.includes("ROLE_USER")) setRole("USER");
            else setRole("UNKNOWN");

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
            const dashboardRes = await api.get("/api/dashboard", { headers });
            setDashboardData(dashboardRes.data);

            if (isAdmin) {
                try {
                    const [calisanlarRes, hizliStatsRes] = await Promise.all([
                        api.get("/api/dashboard/calisanlar-ozet", { headers }),
                        api.get("/api/dashboard/hizli-istatistikler", { headers }),
                    ]);
                    setCalisanlarOzet(calisanlarRes.data);
                    setHizliIstatistikler(hizliStatsRes.data);
                } catch (err) {
                    console.warn("Ek admin verileri alınamadı:", err);
                }
            }

            try {
                const projelerRes = await api.get("/api/dashboard/projeler-ozet", {
                    headers,
                });
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

    if (loading)
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                    fontSize: "18px",
                }}
            >
                Yükleniyor...
            </div>
        );

    if (error)
        return (
            <div
                style={{
                    color: "red",
                    padding: "20px",
                    backgroundColor: "#ffe6e6",
                    margin: "20px",
                    borderRadius: "8px",
                    border: "1px solid #ffcccc",
                }}
            >
                <strong>Hata:</strong> {error}
            </div>
        );

    const StatCard = ({ title, value, color = "#3498db", icon = "📊" }) => (
        <div
            style={{
                backgroundColor: "white",
                border: `3px solid ${color}`,
                borderRadius: "12px",
                padding: "24px",
                textAlign: "center",
                minWidth: "180px",
                margin: "10px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                cursor: "pointer",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
            }}
        >
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>{icon}</div>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#7f8c8d", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {title}
            </h3>
            <p style={{ margin: 0, fontSize: "28px", fontWeight: "bold", color: color }}>{value}</p>
        </div>
    );

    const DurumBadge = ({ durum }) => {
        const colors = {
            DEVAM_EDIYOR: { bg: "#e3f2fd", color: "#1976d2", icon: "🔄" },
            TAMAMLANDI: { bg: "#e8f5e8", color: "#388e3c", icon: "✅" },
            ARA_VERILDI: { bg: "#fff3e0", color: "#f57c00", icon: "⏸️" },
            BELIRTILMEMIS: { bg: "#f5f5f5", color: "#757575", icon: "❓" },
        };
        const style = colors[durum] || colors.BELIRTILMEMIS;
        return (
            <span
                style={{
                    backgroundColor: style.bg,
                    color: style.color,
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                }}
            >
                <span>{style.icon}</span>
                {durum}
            </span>
        );
    };

    const ProjeCard = ({ proje, isSmall = false }) => (
        <div
            style={{
                backgroundColor: "white",
                border: "1px solid #e1e8ed",
                borderRadius: "12px",
                padding: isSmall ? "16px" : "20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                transition: "all 0.3s ease",
                cursor: "pointer",
                height: isSmall ? "auto" : "200px",
                display: "flex",
                flexDirection: "column",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <h4 style={{ margin: 0, fontSize: isSmall ? "16px" : "18px", color: "#2c3e50", flex: 1 }}>
                    📁 {proje.baslik || "Proje Adı Belirtilmemiş"}
                </h4>
                <DurumBadge durum={proje.durum || "BELIRTILMEMIS"} />
            </div>

            {!isSmall && (
                <div style={{ flex: 1 }}>
                    <p style={{ margin: "8px 0", color: "#7f8c8d", fontSize: "14px" }}>
                        📅 {formatDate(proje.baslangicTarihi)} - {formatDate(proje.bitisTarihi)}
                    </p>
                    <p style={{ margin: "8px 0", color: "#7f8c8d", fontSize: "14px" }}>
                        👥 {proje.calisanlar?.length || 0} çalışan
                    </p>
                    {proje.aciklama && (
                        <p style={{ margin: "8px 0", color: "#34495e", fontSize: "13px", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {proje.aciklama.length > 60 ? proje.aciklama.substring(0, 60) + "..." : proje.aciklama}
                        </p>
                    )}
                </div>
            )}

            <div style={{ marginTop: "auto", paddingTop: "8px" }}>
                <span style={{ fontSize: "12px", color: "#bdc3c7" }}>ID: {proje.id}</span>
            </div>
        </div>
    );

    const renderDashboardContent = () => {
        return (
            <div>
                {/* Hoş Geldin Mesajı */}
                <div style={{ marginBottom: "30px", textAlign: "center" }}>
                    <h2 style={{ ...h2Style, fontSize: "28px", textAlign: "center" }}>
                        🎉 Hoş geldin, {username}!
                    </h2>
                    <p style={{ color: "#7f8c8d", fontSize: "16px" }}>
                        {role === "ADMIN" ? "Admin olarak sistemi yönetebilirsin." : "Projelerini takip edebilirsin."}
                    </p>
                </div>

                {/* Ana İstatistikler */}
                <div style={{ marginBottom: "40px" }}>
                    <h3 style={h3Style}>📈 Genel İstatistikler</h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", justifyContent: "center" }}>
                        <StatCard
                            title="Toplam Proje"
                            value={projelerOzet?.toplamProjeSayisi || 0}
                            color="#3498db"
                            icon="📋"
                        />

                        {role === "ADMIN" && (
                            <StatCard
                                title="Toplam Çalışan"
                                value={calisanlarOzet?.toplamCalisanSayisi || 0}
                                color="#2ecc71"
                                icon="👥"
                            />
                        )}

                        {projelerOzet?.durumDagilimi && (
                            <>
                                <StatCard
                                    title="Devam Eden"
                                    value={projelerOzet.durumDagilimi['DEVAM_EDIYOR'] || 0}
                                    color="#f39c12"
                                    icon="🔄"
                                />
                                <StatCard
                                    title="Tamamlanan"
                                    value={projelerOzet.durumDagilimi['TAMAMLANDI'] || 0}
                                    color="#27ae60"
                                    icon="✅"
                                />
                            </>
                        )}
                    </div>
                </div>

                {/* Proje Durum Dağılımı */}
                {projelerOzet?.durumDagilimi && (
                    <div style={{ marginBottom: "40px" }}>
                        <h3 style={h3Style}>📊 Proje Durum Dağılımı</h3>
                        <div style={{
                            backgroundColor: "white",
                            borderRadius: "12px",
                            padding: "24px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                        }}>
                            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", justifyContent: "center" }}>
                                {Object.entries(projelerOzet.durumDagilimi).map(([durum, sayi]) => (
                                    <div key={durum} style={{
                                        textAlign: "center",
                                        padding: "16px",
                                        borderRadius: "8px",
                                        backgroundColor: "#f8f9fa",
                                        minWidth: "120px"
                                    }}>
                                        <DurumBadge durum={durum} />
                                        <p style={{ margin: "12px 0 0 0", fontSize: "24px", fontWeight: "bold", color: "#2c3e50" }}>
                                            {sayi}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Son Eklenen Projeler */}
                {projelerOzet?.projeler && projelerOzet.projeler.length > 0 && (
                    <div style={{ marginBottom: "40px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h3 style={h3Style}>🆕 Son Eklenen Projeler</h3>
                            <button
                                onClick={() => setActiveTab("projeler")}
                                style={{
                                    padding: "8px 16px",
                                    backgroundColor: "#f39c12",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                }}
                            >
                                Tümünü Gör →
                            </button>
                        </div>
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                            gap: "20px"
                        }}>
                            {projelerOzet.projeler
                                .sort((a, b) => new Date(b.olusturmaTarihi || 0) - new Date(a.olusturmaTarihi || 0))
                                .slice(0, 3)
                                .map((proje) => (
                                    <ProjeCard key={proje.id} proje={proje} />
                                ))}
                        </div>
                    </div>
                )}

                {/* Admin İstatistikleri */}
                {role === "ADMIN" && hizliIstatistikler && (
                    <div style={{ marginBottom: "40px" }}>
                        <h3 style={h3Style}>⚡ Hızlı İstatistikler</h3>
                        <div style={{
                            backgroundColor: "white",
                            borderRadius: "12px",
                            padding: "24px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                        }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
                                {Object.entries(hizliIstatistikler).map(([key, value]) => (
                                    <div key={key} style={{
                                        padding: "16px",
                                        borderRadius: "8px",
                                        backgroundColor: "#f8f9fa",
                                        textAlign: "center"
                                    }}>
                                        <p style={{ margin: "0 0 8px 0", color: "#7f8c8d", fontSize: "14px", textTransform: "capitalize" }}>
                                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                                        </p>
                                        <p style={{ margin: 0, fontSize: "20px", fontWeight: "bold", color: "#2c3e50" }}>
                                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Çalışan Özeti (Sadece Admin) */}
                {role === "ADMIN" && calisanlarOzet && (
                    <div style={{ marginBottom: "40px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h3 style={h3Style}>👥 Çalışan Özeti</h3>
                            <button
                                onClick={() => setActiveTab("calisanlar")}
                                style={{
                                    padding: "8px 16px",
                                    backgroundColor: "#2ecc71",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                }}
                            >
                                Detaya Git →
                            </button>
                        </div>
                        <div style={{
                            backgroundColor: "white",
                            borderRadius: "12px",
                            padding: "24px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                        }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
                                <div style={{ textAlign: "center" }}>
                                    <p style={{ margin: "0 0 8px 0", color: "#7f8c8d", fontSize: "14px" }}>Toplam Çalışan</p>
                                    <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold", color: "#2ecc71" }}>
                                        {calisanlarOzet.toplamCalisanSayisi || 0}
                                    </p>
                                </div>

                                {calisanlarOzet.calisanProjeSayilari && (
                                    <div style={{ textAlign: "center" }}>
                                        <p style={{ margin: "0 0 8px 0", color: "#7f8c8d", fontSize: "14px" }}>Proje Atanmış Çalışan</p>
                                        <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold", color: "#3498db" }}>
                                            {(() => {
                                                if (!calisanlarOzet.calisanProjeSayilari) return "0";
                                                const values = Object.values(calisanlarOzet.calisanProjeSayilari);
                                                return values.filter(sayi => sayi > 0).length;
                                            })()}
                                        </p>
                                    </div>
                                )}

                                <div style={{ textAlign: "center" }}>
                                    <p style={{ margin: "0 0 8px 0", color: "#7f8c8d", fontSize: "14px" }}>Ortalama Proje/Çalışan</p>
                                    <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold", color: "#9b59b6" }}>
                                        {calisanlarOzet.calisanProjeSayilari
                                            ? (Object.values(calisanlarOzet.calisanProjeSayilari).reduce((a, b) => a + b, 0) /
                                                Object.keys(calisanlarOzet.calisanProjeSayilari).length).toFixed(1)
                                            : "0"
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sistem Bilgisi */}
                {dashboardData && (
                    <div style={{
                        backgroundColor: "white",
                        borderRadius: "12px",
                        padding: "20px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        textAlign: "center",
                        marginTop: "40px"
                    }}>
                        <p style={{ margin: 0, color: "#7f8c8d", fontSize: "14px" }}>
                            🕒 Son güncelleme: {new Date(dashboardData.timestamp).toLocaleString("tr-TR")}
                        </p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                backgroundColor: "#f5f6fa",
                margin: 0,
                padding: 0,
                width: "100vw",
                overflowX: "hidden",
            }}
        >
            {/* Header */}
            <div
                style={{
                    backgroundColor: "white",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    padding: "15px 20px",
                    marginBottom: "20px",
                    width: "100%",
                    boxSizing: "border-box",
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: "24px", color: "#2c3e50" }}>
                            {role === "ADMIN" ? "🔧 Admin Anasayfası" : "👤 Kullanıcı Anasayfası"}
                        </h1>
                        <p style={{ margin: "5px 0 0 0", color: "#7f8c8d" }}>
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
                            fontWeight: 500,
                        }}
                        onMouseOver={(e) => (e.target.style.backgroundColor = "#c0392b")}
                        onMouseOut={(e) => (e.target.style.backgroundColor = "#e74c3c")}
                    >
                        🚪 Çıkış Yap
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{ padding: "0 20px", width: "100%", boxSizing: "border-box" }}>
                <div style={{ marginBottom: "30px" }}>
                    <div style={{ display: "flex", gap: "10px", borderBottom: "1px solid #ddd" }}>
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
                                fontWeight: 500,
                                borderBottom: activeTab === "dashboard" ? "3px solid #2980b9" : "none",
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
                                    fontWeight: 500,
                                    borderBottom: activeTab === "calisanlar" ? "3px solid #27ae60" : "none",
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
                                fontWeight: 500,
                                borderBottom: activeTab === "projeler" ? "3px solid #e67e22" : "none",
                            }}
                        >
                            📋 Projeler
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div
                    style={{
                        backgroundColor: "white",
                        borderRadius: "8px",
                        padding: "30px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        minHeight: "500px",
                        width: "100%",
                        boxSizing: "border-box",
                    }}
                >
                    {activeTab === "dashboard" && renderDashboardContent()}

                    {activeTab === "calisanlar" && (
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
                    )}

                    {activeTab === "projeler" && (
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
                    )}
                </div>

                {/* Footer */}
                {dashboardData && (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "20px",
                            color: "#7f8c8d",
                            fontSize: "12px",
                        }}
                    >
                        Son güncelleme: {new Date(dashboardData.timestamp).toLocaleString("tr-TR")}
                    </div>
                )}
            </div>
        </div>
    );
}