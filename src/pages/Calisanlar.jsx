import React, { useState, useEffect } from "react";

export default function Calisanlar({
    role,
    authHeaders,
    refreshAll,
    h2Style,
    h3Style,
    StatCard,
    formatDate,
    api
}) {
    const [calisanlarOzet, setCalisanlarOzet] = useState(null);
    const [calisanlarDetay, setCalisanlarDetay] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Çalışan verilerini yükle
    const loadCalisanlarData = async () => {
        try {
            setLoading(true);
            setError("");

            // Token kontrolü
            const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
            if (!token) {
                setError("Token bulunamadı. Lütfen tekrar giriş yapın.");
                return;
            }

            const headers = authHeaders();
            console.log("API isteği gönderiliyor, headers:", headers);

            let calisanlarData = [];
            let calisanlarOzetData = null;

            try {
                // Ana çalışanlar listesi
                const calisanlarRes = await api.get("/api/calisanlar", { headers });
                // Backend çoğunlukla { success, data } döndürüyor
                if (calisanlarRes.data && Array.isArray(calisanlarRes.data.data)) {
                    calisanlarData = calisanlarRes.data.data;
                } else {
                    calisanlarData = calisanlarRes.data;
                }
                console.log("Çalışanlar verisi:", calisanlarData);
            } catch (err) {
                console.warn("Ana çalışanlar endpoint hatası:", err.response?.status, err.response?.data);
                // Alternatif endpoint denemeleri
                try {
                    const altRes = await api.get("/api/dashboard/calisanlar", { headers });
                    calisanlarData = altRes.data?.data || altRes.data;
                } catch (altErr) {
                    console.warn("Alternatif endpoint de başarısız:", altErr.response?.status);
                }
            }

            try {
                // Özet bilgiler
                const ozetRes = await api.get("/api/dashboard/calisanlar-ozet", { headers });
                calisanlarOzetData = ozetRes.data;
                console.log("Çalışanlar özet verisi:", calisanlarOzetData);
            } catch (err) {
                console.warn("Çalışanlar özet endpoint hatası:", err.response?.status, err.response?.data);
            }

            // Veriyi normalize et
            if (Array.isArray(calisanlarData)) {
                setCalisanlarDetay(calisanlarData);
            } else if (Array.isArray(calisanlarData?.data)) {
                setCalisanlarDetay(calisanlarData.data);
            } else if (calisanlarData?.calisanlar && Array.isArray(calisanlarData.calisanlar)) {
                setCalisanlarDetay(calisanlarData.calisanlar);
            }

            if (calisanlarOzetData) {
                setCalisanlarOzet(calisanlarOzetData);
            } else {
                // Özet veri yoksa kendi oluşturalım
                setCalisanlarOzet({
                    toplamCalisanSayisi: calisanlarData?.length || 0,
                    calisanlar: Array.isArray(calisanlarData) ? calisanlarData : [],
                    calisanProjeSayilari: {}
                });
            }

        } catch (error) {
            console.error("Çalışanlar yükleme hatası:", error);
            setError("Çalışan verileri yüklenirken hata oluştu: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (role === "ADMIN") {
            loadCalisanlarData();
        }
    }, [role]);

    const createEmployee = async () => {
        const ad = window.prompt("Çalışan adı:");
        if (!ad) return;
        const soyad = window.prompt("Çalışan soyadı:") || "";
        const eposta = window.prompt("Email (opsiyonel):") || "";
        const pozisyon = window.prompt("Pozisyon (opsiyonel):") || "";
        const telefon = window.prompt("Telefon (opsiyonel):") || "";

        try {
            console.log("Yeni çalışan ekleniyor:", { ad, soyad, eposta, pozisyon, telefon });

            const response = await api.post(
                "/api/calisanlar",
                { ad, soyad, eposta, pozisyon, telefon },
                { headers: authHeaders() }
            );

            console.log("Çalışan ekleme response:", response.data);
            alert("Çalışan başarıyla eklendi ✅");
            await loadCalisanlarData(); // Kendi reload fonksiyonumuzu kullan
            if (refreshAll) await refreshAll(); // Ana dashboard'u da yenile
        } catch (err) {
            console.error("Çalışan ekleme hatası:", err);
            let errorMessage = "Bilinmeyen hata";

            if (err.response?.status === 401) {
                errorMessage = "Yetki hatası. Lütfen tekrar giriş yapın.";
            } else if (err.response?.status === 403) {
                errorMessage = "Bu işlem için yetkiniz yok.";
            } else {
                errorMessage = err.response?.data?.message || err.response?.data || err.message;
            }

            alert("Çalışan eklenemedi: " + errorMessage);
        }
    };

    const updateEmployee = async (calisan) => {
        const ad = window.prompt("Yeni ad:", calisan.ad || "");
        if (ad === null) return; // iptal
        const soyad = window.prompt("Yeni soyad:", calisan.soyad || "") ?? "";
        const eposta = window.prompt("Yeni email:", calisan.eposta || "") ?? "";
        const pozisyon = window.prompt("Yeni pozisyon:", calisan.pozisyon || "") ?? "";
        const telefon = window.prompt("Yeni telefon:", calisan.telefon || "") ?? "";

        try {
            await api.put(
                `/api/calisanlar/${calisan.id}`,
                { ad, soyad, eposta, pozisyon, telefon },
                { headers: authHeaders() }
            );
            alert("Çalışan güncellendi ✅");
            await loadCalisanlarData();
            if (refreshAll) await refreshAll();
        } catch (err) {
            console.error("Çalışan güncelleme hatası:", err);
            alert("Güncelleme hatası: " + (err.response?.data?.message || err.response?.data || err.message));
        }
    };

    const deleteEmployee = async (calisanId) => {
        if (!window.confirm("Bu çalışan silinsin mi? Bu işlem geri alınamaz!")) return;

        try {
            await api.delete(`/api/calisanlar/${calisanId}`, { headers: authHeaders() });
            alert("Çalışan silindi 🗑️");
            await loadCalisanlarData();
            if (refreshAll) await refreshAll();
        } catch (err) {
            console.error("Çalışan silme hatası:", err);
            alert("Silme hatası: " + (err.response?.data?.message || err.response?.data || err.message));
        }
    };

    // Loading durumu
    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <h3>📥 Çalışan verileri yükleniyor...</h3>
                <p>Lütfen bekleyin.</p>
            </div>
        );
    }

    // Error durumu
    if (error) {
        return (
            <div style={{
                color: "red",
                padding: "20px",
                backgroundColor: "#ffe6e6",
                margin: "20px",
                borderRadius: "8px",
                border: "1px solid #ffcccc",
            }}>
                <strong>Hata:</strong> {error}
                <br />
                <button
                    onClick={loadCalisanlarData}
                    style={{
                        marginTop: "10px",
                        padding: "8px 16px",
                        backgroundColor: "#3498db",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer"
                    }}
                >
                    Tekrar Dene
                </button>
            </div>
        );
    }

    // Yetki kontrolü
    if (role !== "ADMIN") {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <h3>⚠️ Bu bölüme erişim yetkiniz yok</h3>
                <p>Çalışanlar bölümü sadece admin kullanıcılar içindir.</p>
            </div>
        );
    }

    // Çalışanları belirle - önce detay listesini, yoksa özetten
    const calisanlarListesi = calisanlarDetay.length > 0
        ? calisanlarDetay
        : (calisanlarOzet?.calisanlar || []);

    console.log("Render edilecek çalışanlar:", calisanlarListesi);

    return (
        <div>
            <div style={{ marginBottom: '30px' }}>
                <h2 style={h2Style}>👥 Çalışanlar Yönetimi</h2>
                <p style={{ color: '#666', marginBottom: '20px' }}>
                    <strong>Toplam Çalışan:</strong> {calisanlarOzet?.toplamCalisanSayisi || calisanlarListesi.length || 0}
                </p>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <button
                        onClick={createEmployee}
                        style={{
                            padding: '10px 14px',
                            borderRadius: 8,
                            border: '1px solid #3498db',
                            background: '#3498db',
                            color: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        + Yeni Çalışan
                    </button>
                    <button
                        onClick={loadCalisanlarData}
                        style={{
                            padding: '10px 14px',
                            borderRadius: 8,
                            border: '1px solid #2ecc71',
                            background: '#2ecc71',
                            color: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        🔄 Yenile
                    </button>
                </div>
            </div>

            {/* Çalışan İstatistikleri */}
            <div style={{ marginBottom: '30px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                    <StatCard
                        title="Toplam Çalışan"
                        value={calisanlarOzet?.toplamCalisanSayisi || calisanlarListesi.length || 0}
                        color="#3498db"
                    />
                    {calisanlarOzet?.calisanProjeSayilari && (
                        <StatCard
                            title="Ortalama Proje/Kişi"
                            value={(() => {
                                const projeSayilari = Object.values(calisanlarOzet.calisanProjeSayilari);
                                if (projeSayilari.length === 0) return 0;
                                const toplam = projeSayilari.reduce((a, b) => a + b, 0);
                                return Math.round(toplam / projeSayilari.length * 10) / 10;
                            })()}
                            color="#9b59b6"
                        />
                    )}
                    <StatCard
                        title="Aktif Çalışan"
                        value={(() => {
                            if (!calisanlarOzet?.calisanProjeSayilari) return 0;
                            return Object.values(calisanlarOzet.calisanProjeSayilari).filter(sayi => sayi > 0).length;
                        })()}
                        color="#2ecc71"
                    />
                </div>
            </div>

            {/* Debug Bilgisi */}
            <div style={{
                backgroundColor: '#f8f9fa',
                padding: '10px',
                borderRadius: '4px',
                marginBottom: '20px',
                fontSize: '12px',
                color: '#6c757d'
            }}>
                <strong>Debug:</strong> {calisanlarListesi.length} çalışan bulundu.
                Detay listesi: {calisanlarDetay.length},
                Özet listesi: {calisanlarOzet?.calisanlar?.length || 0}
            </div>

            {/* Çalışan Listesi */}
            {calisanlarListesi.length > 0 ? (
                <div>
                    <h3 style={h3Style}>📋 Tüm Çalışanlar ({calisanlarListesi.length})</h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                        gap: '20px'
                    }}>
                        {calisanlarListesi.map((calisan, index) => (
                            <div key={calisan.id || index} style={{
                                border: '1px solid #e1e8ed',
                                borderRadius: '12px',
                                padding: '20px',
                                backgroundColor: 'white',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                cursor: 'pointer'
                            }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                backgroundColor: '#3498db',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontWeight: 'bold',
                                                fontSize: '16px',
                                                marginRight: '12px'
                                            }}>
                                                {calisan.ad ? calisan.ad.charAt(0).toUpperCase() : '?'}
                                            </div>
                                            <div>
                                                <h4 style={{ margin: '0', fontSize: '18px', color: '#2c3e50' }}>
                                                    {calisan.ad && calisan.soyad
                                                        ? `${calisan.ad} ${calisan.soyad}`
                                                        : calisan.ad || calisan.soyad || 'İsim Belirtilmemiş'}
                                                </h4>
                                                <p style={{ margin: '2px 0 0 0', color: '#7f8c8d', fontSize: '14px' }}>
                                                    ID: {calisan.id}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{
                                        backgroundColor: '#3498db',
                                        color: 'white',
                                        padding: '6px 12px',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: '600'
                                    }}>
                                        {calisanlarOzet?.calisanProjeSayilari?.[calisan.id] || 0} proje
                                    </div>
                                </div>

                                <div style={{ marginBottom: '10px' }}>
                                    <p style={{ margin: '0', color: '#34495e', fontSize: '16px', fontWeight: '500' }}>
                                        🏢 {calisan.pozisyon || 'Pozisyon Belirtilmemiş'}
                                    </p>
                                </div>

                                <div style={{ borderTop: '1px solid #ecf0f1', paddingTop: '15px' }}>
                                    <p style={{ margin: '0 0 8px 0', color: '#7f8c8d', fontSize: '14px' }}>
                                        📧 {calisan.eposta || 'Email Belirtilmemiş'}
                                    </p>
                                    <p style={{ margin: '0 0 8px 0', color: '#7f8c8d', fontSize: '14px' }}>
                                        📞 {calisan.telefon || 'Telefon Belirtilmemiş'}
                                    </p>
                                    {calisan.olusturmaTarihi && (
                                        <p style={{ margin: '0 0 8px 0', color: '#7f8c8d', fontSize: '14px' }}>
                                            📅 Kayıt: {formatDate(calisan.olusturmaTarihi)}
                                        </p>
                                    )}

                                    {/* Çalışanın Projeleri */}
                                    <div style={{ marginTop: '12px' }}>
                                        <p style={{ margin: '0 0 6px 0', color: '#34495e', fontSize: '14px', fontWeight: '500' }}>
                                            🔧 Aktif Projeler:
                                        </p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                            {(() => {
                                                if (calisan.projeler && Array.isArray(calisan.projeler) && calisan.projeler.length > 0) {
                                                    return calisan.projeler.map((proje, idx) => (
                                                        <span key={idx} style={{
                                                            backgroundColor: '#e3f2fd',
                                                            color: '#1976d2',
                                                            padding: '3px 8px',
                                                            borderRadius: '12px',
                                                            fontSize: '12px',
                                                            border: '1px solid #bbdefb',
                                                            display: 'inline-block'
                                                        }}>
                                                            {proje.baslik || proje.ad || proje.isim || 'İsimsiz Proje'}
                                                        </span>
                                                    ));
                                                } else {
                                                    const projeSayisi = calisanlarOzet?.calisanProjeSayilari?.[calisan.id] || 0;
                                                    return (
                                                        <span style={{
                                                            color: '#6c757d',
                                                            fontSize: '12px',
                                                            fontStyle: 'italic'
                                                        }}>
                                                            {projeSayisi > 0
                                                                ? `${projeSayisi} proje atanmış`
                                                                : 'Henüz proje atanmamış'
                                                            }
                                                        </span>
                                                    );
                                                }
                                            })()}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                                    <button
                                        onClick={() => updateEmployee(calisan)}
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: 8,
                                            border: '1px solid #3498db',
                                            background: '#3498db',
                                            color: 'white',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Düzenle
                                    </button>
                                    <button
                                        onClick={() => deleteEmployee(calisan.id)}
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: 8,
                                            border: '1px solid #e74c3c',
                                            background: '#e74c3c',
                                            color: 'white',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Sil
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div style={{
                    textAlign: 'center',
                    padding: '50px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    border: '1px solid #e1e8ed'
                }}>
                    <h3 style={{ color: '#7f8c8d' }}>📭 Henüz çalışan bulunmuyor</h3>
                    <p style={{ color: '#bdc3c7' }}>Sisteme çalışan eklendikçe burada görünecektir.</p>
                    <button
                        onClick={createEmployee}
                        style={{
                            padding: '12px 20px',
                            backgroundColor: '#3498db',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            marginTop: '10px'
                        }}
                    >
                        İlk Çalışanı Ekle
                    </button>
                </div>
            )}
        </div>
    );
}