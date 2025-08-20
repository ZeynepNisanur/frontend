import React from "react";

export default function Projeler({
    projelerOzet,
    role,
    authHeaders,
    refreshAll,
    h2Style,
    h3Style,
    StatCard,
    DurumBadge,
    formatDate,
    api
}) {
    const createProject = async () => {
        const baslik = window.prompt("Proje başlığı:");
        if (!baslik) return;
        const aciklama = window.prompt("Açıklama (opsiyonel):") || "";
        const baslangicTarihi = window.prompt("Başlangıç (YYYY-MM-DD):") || "";
        const bitisTarihi = window.prompt("Bitiş (YYYY-MM-DD):") || "";
        const durum = window.prompt("Durum (DEVAM_EDIYOR / TAMAMLANDI / ARA_VERILDI):") || "DEVAM_EDIYOR";

        try {
            await api.post(
                "/api/projeler",
                { baslik, aciklama, baslangicTarihi, bitisTarihi, durum },
                { headers: authHeaders() }
            );
            alert("Proje eklendi ✅");
            await refreshAll();
        } catch (err) {
            alert("Proje eklenemedi: " + (err.response?.data || err.message));
        }
    };

    const updateProjectStatus = async (projeId, currentStatus) => {
        // Önce yetki kontrolü yap
        if (role !== "ADMIN") {
            alert("Bu işlem için admin yetkisi gerekiyor!");
            return;
        }

        const statusOptions = ["DEVAM_EDIYOR", "TAMAMLANDI", "ARA_VERILDI"];
        const statusDisplayNames = {
            "DEVAM_EDIYOR": "Devam Ediyor",
            "TAMAMLANDI": "Tamamlandı",
            "ARA_VERILDI": "Ara Verildi"
        };

        // Mevcut durumu göster ve seçenekleri listele
        let message = `Mevcut durum: ${statusDisplayNames[currentStatus] || currentStatus}\n\n`;
        message += "Yeni durum seçin:\n";
        statusOptions.forEach((status, index) => {
            message += `${index + 1}. ${statusDisplayNames[status]}\n`;
        });
        message += "\nLütfen 1, 2 veya 3 yazın:";

        const choice = window.prompt(message);
        if (!choice) return;

        const choiceNumber = parseInt(choice);
        if (choiceNumber < 1 || choiceNumber > 3 || isNaN(choiceNumber)) {
            alert("Geçersiz seçim! Lütfen 1, 2 veya 3 yazın.");
            return;
        }

        const newStatus = statusOptions[choiceNumber - 1];

        // Aynı durum seçilmişse işlem yapma
        if (newStatus === currentStatus) {
            alert("Seçilen durum mevcut durumla aynı.");
            return;
        }

        try {
            console.log("Durum güncelleme isteği gönderiliyor:", {
                projeId,
                currentStatus,
                newStatus,
                headers: authHeaders()
            });

            // Farklı endpoint denemeleri için alternatifler
            let response;
            try {
                // İlk deneme: PUT /api/projeler/{projeId}/durum
                response = await api.put(
                    `/api/projeler/${projeId}/durum`,
                    { durum: newStatus },
                    { headers: authHeaders() }
                );
            } catch (firstError) {
                console.log("İlk endpoint başarısız, alternatif deneniyor...", firstError.response?.status);

                if (firstError.response?.status === 403 || firstError.response?.status === 404) {
                    try {
                        // İkinci deneme: PUT /api/projeler/{projeId}
                        response = await api.put(
                            `/api/projeler/${projeId}`,
                            { durum: newStatus },
                            { headers: authHeaders() }
                        );
                    } catch (secondError) {
                        console.log("İkinci endpoint başarısız, üçüncü deneniyor...", secondError.response?.status);

                        // Üçüncü deneme: PATCH /api/projeler/{projeId}
                        response = await api.patch(
                            `/api/projeler/${projeId}`,
                            { durum: newStatus },
                            { headers: authHeaders() }
                        );
                    }
                } else {
                    throw firstError;
                }
            }

            alert(`Proje durumu "${statusDisplayNames[newStatus]}" olarak güncellendi ✅`);
            await refreshAll();
        } catch (err) {
            console.error("API Hatası:", err);
            console.error("Error response:", err.response);
            console.error("Error status:", err.response?.status);
            console.error("Error data:", err.response?.data);

            let errorMessage = "Bilinmeyen hata";

            if (err.response?.status === 403) {
                errorMessage = "Yetki hatası: Bu projeyi güncelleme yetkiniz yok";
            } else if (err.response?.status === 404) {
                errorMessage = "Proje bulunamadı veya endpoint mevcut değil";
            } else if (err.response?.status === 401) {
                errorMessage = "Oturum süresi dolmuş, lütfen tekrar giriş yapın";
            } else {
                errorMessage = err.response?.data?.message || err.response?.data || err.message;
            }

            alert("Durum güncelleme hatası: " + errorMessage);
        }
    };

    const deleteProject = async (projeId) => {
        if (!window.confirm("Bu proje silinsin mi?")) return;
        try {
            await api.delete(`/api/projeler/${projeId}`, { headers: authHeaders() });
            alert("Proje silindi 🗑️");
            await refreshAll();
        } catch (err) {
            alert("Silme hatası: " + (err.response?.data || err.message));
        }
    };

    const addEmployeeToThisProject = async (projeId) => {
        const calisanId = window.prompt("Hangi çalışan ID eklensin?");
        if (!calisanId) return;

        try {
            // Backend'inizdeki doğru endpoint: /api/projeler/{projeId}/calisanlar/{calisanId}/ekle
            await api.post(`/api/projeler/${projeId}/calisanlar/${calisanId}/ekle`, {}, { headers: authHeaders() });
            alert("Çalışan projeye eklendi ✅");
            await refreshAll();
        } catch (err) {
            console.error("API Hatası:", err);
            const errorMessage = err.response?.data?.message || err.response?.data || err.message;
            alert("Ekleme hatası: " + errorMessage);
        }
    };

    const removeEmployeeFromThisProject = async (projeId) => {
        const calisanId = window.prompt("Hangi çalışan ID çıkarılsın?");
        if (!calisanId) return;

        try {
            // Backend'inizdeki doğru endpoint: /api/projeler/{projeId}/calisanlar/{calisanId}/cikar
            await api.delete(`/api/projeler/${projeId}/calisanlar/${calisanId}/cikar`, { headers: authHeaders() });
            alert("Çalışan projeden çıkarıldı ✅");
            await refreshAll();
        } catch (err) {
            console.error("API Hatası:", err);
            const errorMessage = err.response?.data?.message || err.response?.data || err.message;
            alert("Çıkarma hatası: " + errorMessage);
        }
    };

    if (!projelerOzet) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <h3>📥 Proje verileri yükleniyor...</h3>
                <p>Lütfen bekleyin.</p>
            </div>
        );
    }

    return (
        <div>
            <div style={{ marginBottom: '30px' }}>
                <h2 style={h2Style}>📋 Projeler Yönetimi</h2>
                <p style={{ color: '#666', marginBottom: '20px' }}>
                    <strong>Toplam Proje:</strong> {projelerOzet.toplamProjeSayisi}
                </p>
                {role === "ADMIN" && (
                    <button
                        onClick={createProject}
                        style={{
                            padding: '10px 14px',
                            borderRadius: 8,
                            border: '1px solid #2ecc71',
                            background: '#2ecc71',
                            color: 'white',
                            cursor: 'pointer',
                            marginBottom: 14
                        }}
                    >
                        + Yeni Proje
                    </button>
                )}
            </div>

            {/* Proje İstatistikleri */}
            <div style={{ marginBottom: '30px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                    <StatCard
                        title="Toplam Proje"
                        value={projelerOzet.toplamProjeSayisi || 0}
                        color="#2ecc71"
                    />
                    {projelerOzet.durumDagilimi && (
                        <>
                            <StatCard
                                title="Devam Eden"
                                value={projelerOzet.durumDagilimi['DEVAM_EDIYOR'] || 0}
                                color="#f39c12"
                            />
                            <StatCard
                                title="Tamamlanan"
                                value={projelerOzet.durumDagilimi['TAMAMLANDI'] || 0}
                                color="#712ECC"
                            />
                            <StatCard
                                title="Ara Verildi"
                                value={projelerOzet.durumDagilimi['ARA_VERILDI'] || 0}
                                color="#e67e22"
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Durum Dağılımı */}
            {projelerOzet.durumDagilimi && Object.keys(projelerOzet.durumDagilimi).length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                    <h3 style={h3Style}>📊 Proje Durum Dağılımı</h3>
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                        {Object.entries(projelerOzet.durumDagilimi).map(([durum, sayi]) => (
                            <div key={durum} style={{
                                border: '1px solid #e1e8ed',
                                borderRadius: '12px',
                                padding: '20px',
                                textAlign: 'center',
                                minWidth: '150px',
                                backgroundColor: 'white',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}>
                                <DurumBadge durum={durum} />
                                <p style={{ margin: '15px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: '#2c3e50' }}>
                                    {sayi}
                                </p>
                                <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#7f8c8d' }}>
                                    proje
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Proje Listesi */}
            {projelerOzet.projeler && projelerOzet.projeler.length > 0 ? (
                <div>
                    <h3 style={h3Style}>🚀 Tüm Projeler</h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
                        gap: '20px'
                    }}>
                        {projelerOzet.projeler.map((proje, index) => (
                            <div key={proje.id || index} style={{
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
                                        <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#2c3e50' }}>
                                            📁 {proje.baslik || 'Proje Adı Belirtilmemiş'}
                                        </h4>
                                        <p style={{ margin: '0', color: '#7f8c8d', fontSize: '14px' }}>
                                            ID: {proje.id}
                                        </p>
                                    </div>
                                    <DurumBadge durum={proje.durum || 'BELIRTILMEMIS'} />
                                </div>

                                <div style={{ marginBottom: '15px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ color: '#34495e', fontSize: '14px' }}>
                                            📅 Başlangıç:
                                        </span>
                                        <span style={{ fontWeight: '500', color: '#2c3e50', fontSize: '14px' }}>
                                            {formatDate(proje.baslangicTarihi)}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ color: '#34495e', fontSize: '14px' }}>
                                            🏁 Bitiş:
                                        </span>
                                        <span style={{ fontWeight: '500', color: '#2c3e50', fontSize: '14px' }}>
                                            {formatDate(proje.bitisTarihi)}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#34495e', fontSize: '14px' }}>
                                            👥 Çalışan Sayısı:
                                        </span>
                                        <span style={{
                                            fontWeight: '500',
                                            color: '#2c3e50',
                                            fontSize: '14px',
                                            backgroundColor: '#ecf0f1',
                                            padding: '2px 8px',
                                            borderRadius: '10px'
                                        }}>
                                            {proje.calisanlar?.length || 0} kişi
                                        </span>
                                    </div>
                                </div>

                                {/* Proje Açıklaması varsa */}
                                {proje.aciklama && (
                                    <div style={{
                                        borderTop: '1px solid #ecf0f1',
                                        paddingTop: '15px',
                                        marginTop: '15px'
                                    }}>
                                        <p style={{ margin: '0', color: '#7f8c8d', fontSize: '14px', fontStyle: 'italic' }}>
                                            💬 {proje.aciklama}
                                        </p>
                                    </div>
                                )}

                                {/* Çalışan isimleri varsa (ilk 3'ü göster) */}
                                {proje.calisanlar && proje.calisanlar.length > 0 && (
                                    <div style={{
                                        borderTop: '1px solid #ecf0f1',
                                        paddingTop: '15px',
                                        marginTop: '15px'
                                    }}>
                                        <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#7f8c8d', fontWeight: '500' }}>
                                            Çalışanlar:
                                        </p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                            {proje.calisanlar.slice(0, 3).map((calisan, idx) => (
                                                <span key={idx} style={{
                                                    backgroundColor: '#3498db',
                                                    color: 'white',
                                                    padding: '3px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '11px',
                                                    fontWeight: '500'
                                                }}>
                                                    {calisan.ad || `Çalışan ${idx + 1}`}
                                                </span>
                                            ))}
                                            {proje.calisanlar.length > 3 && (
                                                <span style={{
                                                    backgroundColor: '#95a5a6',
                                                    color: 'white',
                                                    padding: '3px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '11px',
                                                    fontWeight: '500'
                                                }}>
                                                    +{proje.calisanlar.length - 3} daha
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                                    <button
                                        onClick={() => addEmployeeToThisProject(proje.id)}
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: 8,
                                            border: '1px solid #2ecc71',
                                            background: '#2ecc71',
                                            color: 'white',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Çalışan Ekle
                                    </button>

                                    <button
                                        onClick={() => removeEmployeeFromThisProject(proje.id)}
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: 8,
                                            border: '1px solid #f39c12',
                                            background: '#f39c12',
                                            color: 'white',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Çalışan Çıkar
                                    </button>

                                    {role === "ADMIN" && (
                                        <>
                                            <button
                                                onClick={() => updateProjectStatus(proje.id, proje.durum)}
                                                style={{
                                                    padding: '8px 12px',
                                                    borderRadius: 8,
                                                    border: '1px solid #9b59b6',
                                                    background: '#9b59b6',
                                                    color: 'white',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Durum Güncelle
                                            </button>

                                            <button
                                                onClick={() => deleteProject(proje.id)}
                                                style={{
                                                    padding: '8px 12px',
                                                    borderRadius: 8,
                                                    border: '1px solid #e74c3c',
                                                    background: '#e74c3c',
                                                    color: 'white',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Projeyi Sil
                                            </button>
                                        </>
                                    )}
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
                    <h3 style={{ color: '#7f8c8d' }}>📭 Henüz proje bulunmuyor</h3>
                    <p style={{ color: '#bdc3c7' }}>
                        {role === "ADMIN"
                            ? "Sisteme proje eklendikçe burada görünecektir."
                            : "Size atanan projeler burada görünecektir."
                        }
                    </p>
                </div>
            )}
        </div>
    );
}