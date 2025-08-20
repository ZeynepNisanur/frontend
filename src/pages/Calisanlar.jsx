import React from "react";

export default function Calisanlar({
    calisanlarOzet,
    role,
    authHeaders,
    refreshAll,
    h2Style,
    h3Style,
    StatCard,
    formatDate,
    api
}) {
    const createEmployee = async () => {
        const ad = window.prompt("Çalışan adı:");
        if (!ad) return;
        const soyad = window.prompt("Çalışan soyadı:") || "";
        const eposta = window.prompt("Email (opsiyonel):") || "";
        const pozisyon = window.prompt("Pozisyon (opsiyonel):") || "";

        try {
            await api.post(
                "/api/calisanlar",
                { ad, soyad, eposta, pozisyon },
                { headers: authHeaders() }
            );

            alert("Çalışan eklendi ✅");
            await refreshAll();
        } catch (err) {
            alert("Çalışan eklenemedi: " + (err.response?.data || err.message));
        }
    };

    const updateEmployee = async (calisan) => {
        const ad = window.prompt("Yeni ad:", calisan.ad || "");
        if (ad === null) return; // iptal
        const soyad = window.prompt("Yeni soyad:", calisan.soyad || "") ?? "";
        const eposta = window.prompt("Yeni email:", calisan.eposta || "") ?? "";
        const pozisyon = window.prompt("Yeni pozisyon:", calisan.pozisyon || "") ?? "";

        try {
            await api.put(`/api/calisanlar/${calisan.id}`, { ad, soyad, eposta, pozisyon }, { headers: authHeaders() });
            alert("Çalışan güncellendi ✅");
            await refreshAll();
        } catch (err) {
            alert("Güncelleme hatası: " + (err.response?.data || err.message));
        }
    };

    const deleteEmployee = async (calisanId) => {
        if (!window.confirm("Bu çalışan silinsin mi?")) return;
        try {
            await api.delete(`/api/calisanlar/${calisanId}`, { headers: authHeaders() });
            alert("Çalışan silindi 🗑️");
            await refreshAll();
        } catch (err) {
            alert("Silme hatası: " + (err.response?.data || err.message));
        }
    };

    if (role !== "ADMIN") {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <h3>⚠️ Bu bölüme erişim yetkiniz yok</h3>
                <p>Çalışanlar bölümü sadece admin kullanıcılar içindir.</p>
            </div>
        );
    }

    if (!calisanlarOzet) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <h3>📥 Çalışan verileri yükleniyor...</h3>
                <p>Lütfen bekleyin.</p>
            </div>
        );
    }

    return (
        <div>
            <div style={{ marginBottom: '30px' }}>
                <h2 style={h2Style}>👥 Çalışanlar Yönetimi</h2>
                <p style={{ color: '#666', marginBottom: '20px' }}>
                    <strong>Toplam Çalışan:</strong> {calisanlarOzet.toplamCalisanSayisi}
                </p>
                <button
                    onClick={createEmployee}
                    style={{
                        padding: '10px 14px',
                        borderRadius: 8,
                        border: '1px solid #3498db',
                        background: '#3498db',
                        color: 'white',
                        cursor: 'pointer',
                        marginBottom: 14
                    }}
                >
                    + Yeni Çalışan
                </button>
            </div>

            {/* Çalışan İstatistikleri */}
            <div style={{ marginBottom: '30px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                    <StatCard
                        title="Toplam Çalışan"
                        value={calisanlarOzet.toplamCalisanSayisi || 0}
                        color="#3498db"
                    />
                    {calisanlarOzet.calisanProjeSayilari && (
                        <StatCard
                            title="Ortalama Proje/Kişi"
                            value={Math.round(
                                Object.values(calisanlarOzet.calisanProjeSayilari).reduce((a, b) => a + b, 0) /
                                Object.keys(calisanlarOzet.calisanProjeSayilari).length * 10
                            ) / 10 || 0}
                            color="#9b59b6"
                        />
                    )}
                </div>
            </div>

            {/* Çalışan Listesi */}
            {calisanlarOzet.calisanlar && calisanlarOzet.calisanlar.length > 0 ? (
                <div>
                    <h3 style={h3Style}>📋 Tüm Çalışanlar</h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                        gap: '20px'
                    }}>
                        {calisanlarOzet.calisanlar.map((calisan, index) => (
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
                                        {calisanlarOzet.calisanProjeSayilari?.[calisan.id] || 0} proje
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

                                    {/* Çalışanın Projeleri */}
                                    <div style={{ marginTop: '12px' }}>
                                        <p style={{ margin: '0 0 6px 0', color: '#34495e', fontSize: '14px', fontWeight: '500' }}>
                                            🔧 Aktif Projeler:
                                        </p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                            {(() => {
                                                // Debug bilgisi
                                                console.log(`Çalışan ${calisan.id} - Projeler:`, calisan.projeler);

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
                                                            {proje.baslik || proje.ad || proje.isim || proje.name || proje.title || 'İsimsiz Proje'}
                                                        </span>
                                                    ));
                                                } else {
                                                    return (
                                                        <span style={{
                                                            color: '#6c757d',
                                                            fontSize: '12px',
                                                            fontStyle: 'italic'
                                                        }}>
                                                            {(calisanlarOzet.calisanProjeSayilari?.[calisan.id] || 0) > 0
                                                                ? `${calisanlarOzet.calisanProjeSayilari[calisan.id]} proje atanmış (detaylar API'den gelmiyor)`
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
                </div>
            )}
        </div>
    );
}