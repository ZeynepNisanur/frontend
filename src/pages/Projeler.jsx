import React, { useState, useEffect } from "react";

export default function Projeler({
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
    const [projelerOzet, setProjelerOzet] = useState(null);
    const [projelerDetay, setProjelerDetay] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Proje verilerini yükle
    const loadProjelerData = async () => {
        try {
            setLoading(true);
            setError("");

            // Token kontrolü
            const token = localStorage.getItem("token");
            if (!token) {
                setError("Token bulunamadı. Lütfen tekrar giriş yapın.");
                return;
            }

            const headers = authHeaders();
            console.log("Projeler API isteği gönderiliyor, headers:", headers);

            // Farklı endpoint'leri deneyelim
            let projelerData = [];
            let projelerOzetData = null;

            try {
                // Ana projeler listesi
                const projelerRes = await api.get("/api/projeler", { headers });
                projelerData = projelerRes.data;
                console.log("Projeler verisi:", projelerData);
            } catch (err) {
                console.warn("Ana projeler endpoint hatası:", err.response?.status, err.response?.data);
                // Alternatif endpoint denemeleri
                try {
                    const altRes = await api.get("/api/dashboard/projeler", { headers });
                    projelerData = altRes.data;
                } catch (altErr) {
                    console.warn("Alternatif projeler endpoint de başarısız:", altErr.response?.status);
                }
            }

            try {
                // Özet bilgiler
                const ozetRes = await api.get("/api/dashboard/projeler-ozet", { headers });
                projelerOzetData = ozetRes.data;
                console.log("Projeler özet verisi:", projelerOzetData);
            } catch (err) {
                console.warn("Projeler özet endpoint hatası:", err.response?.status, err.response?.data);
            }

            // Veriyi normalize et
            if (Array.isArray(projelerData)) {
                setProjelerDetay(projelerData);
            } else if (projelerData?.projeler && Array.isArray(projelerData.projeler)) {
                setProjelerDetay(projelerData.projeler);
            }

            if (projelerOzetData) {
                setProjelerOzet(projelerOzetData);
            } else {
                // Özet veri yoksa kendi oluşturalım
                const durumDagilimi = {};
                const projelerArray = Array.isArray(projelerData) ? projelerData : [];

                projelerArray.forEach(proje => {
                    const durum = proje.durum || 'BELIRTILMEMIS';
                    durumDagilimi[durum] = (durumDagilimi[durum] || 0) + 1;
                });

                setProjelerOzet({
                    toplamProjeSayisi: projelerArray.length,
                    projeler: projelerArray,
                    durumDagilimi: durumDagilimi
                });
            }

        } catch (error) {
            console.error("Projeler yükleme hatası:", error);
            setError("Proje verileri yüklenirken hata oluştu: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProjelerData();
    }, []);

    const createProject = async () => {
        // Token kontrolü
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Token bulunamadı. Lütfen tekrar giriş yapın.");
            return;
        }

        const baslik = window.prompt("Proje başlığı:");
        if (!baslik) return;

        const aciklama = window.prompt("Açıklama (opsiyonel):") || "";
        const baslangicTarihi = window.prompt("Başlangıç tarihi (YYYY-MM-DD formatında, opsiyonel):") || "";
        const bitisTarihi = window.prompt("Bitiş tarihi (YYYY-MM-DD formatında, opsiyonel):") || "";

        // Durum seçimi için daha kullanıcı dostu yaklaşım
        const durumSecenekleri = {
            "1": "DEVAM_EDIYOR",
            "2": "TAMAMLANDI",
            "3": "ARA_VERILDI"
        };

        let durumSecimi = window.prompt(
            "Proje durumu seçin:\n" +
            "1. Devam Ediyor\n" +
            "2. Tamamlandı\n" +
            "3. Ara Verildi\n\n" +
            "Lütfen 1, 2 veya 3 yazın (varsayılan: 1):"
        ) || "1";

        const durum = durumSecenekleri[durumSecimi] || "DEVAM_EDIYOR";

        try {
            console.log("Yeni proje ekleniyor:", { baslik, aciklama, baslangicTarihi, bitisTarihi, durum });

            const requestData = {
                baslik,
                aciklama,
                durum
            };

            // Tarih varsa ekle
            if (baslangicTarihi) {
                requestData.baslangicTarihi = baslangicTarihi;
            }
            if (bitisTarihi) {
                requestData.bitisTarihi = bitisTarihi;
            }

            const response = await api.post(
                "/api/projeler",
                requestData,
                {
                    headers: authHeaders(),
                    timeout: 10000 // 10 saniye timeout
                }
            );

            console.log("Proje ekleme response:", response.data);
            alert("Proje başarıyla eklendi! ✅");
            await loadProjelerData(); // Kendi reload fonksiyonumuzu kullan
            if (refreshAll) await refreshAll(); // Ana dashboard'u da yenile
        } catch (err) {
            console.error("Proje ekleme hatası:", err);
            console.error("Error response:", err.response);

            let errorMessage = "Bilinmeyen hata";

            if (err.response?.status === 401) {
                errorMessage = "Yetki hatası. Token geçersiz veya süresi dolmuş. Lütfen tekrar giriş yapın.";
                // Token'ı temizle ve login sayfasına yönlendir
                localStorage.removeItem("token");
                window.location.href = "/";
                return;
            } else if (err.response?.status === 403) {
                errorMessage = "Bu işlem için yetkiniz yok. Admin olmanız gerekiyor.";
            } else if (err.response?.status === 400) {
                errorMessage = "Geçersiz veri girişi. Lütfen bilgileri kontrol edin.";
            } else if (err.response?.status === 500) {
                errorMessage = "Sunucu hatası. Lütfen daha sonra tekrar deneyin.";
            } else {
                errorMessage = err.response?.data?.message || err.response?.data || err.message;
            }

            alert("Proje eklenemedi: " + errorMessage);
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

            // Farklı endpoint denemeleri
            let response;
            const endpoints = [
                `/api/projeler/${projeId}/durum`,
                `/api/projeler/${projeId}`,
                `/api/projeler/${projeId}/status`
            ];

            const methods = ['put', 'patch'];
            let lastError;

            for (const method of methods) {
                for (const endpoint of endpoints) {
                    try {
                        console.log(`Denenen: ${method.toUpperCase()} ${endpoint}`);
                        response = await api[method](
                            endpoint,
                            { durum: newStatus },
                            { headers: authHeaders() }
                        );
                        console.log("Başarılı response:", response.data);
                        break;
                    } catch (err) {
                        console.log(`${method.toUpperCase()} ${endpoint} başarısız:`, err.response?.status);
                        lastError = err;
                        if (err.response?.status !== 404 && err.response?.status !== 405) {
                            throw err; // 404 ve 405 dışındaki hatalar için döngüyü kır
                        }
                    }
                }
                if (response) break;
            }

            if (!response) {
                throw lastError || new Error("Tüm endpoint'ler başarısız");
            }

            alert(`Proje durumu "${statusDisplayNames[newStatus]}" olarak güncellendi ✅`);
            await loadProjelerData();
            if (refreshAll) await refreshAll();
        } catch (err) {
            console.error("API Hatası:", err);

            let errorMessage = "Bilinmeyen hata";

            if (err.response?.status === 403) {
                errorMessage = "Yetki hatası: Bu projeyi güncelleme yetkiniz yok";
            } else if (err.response?.status === 404) {
                errorMessage = "Proje bulunamadı";
            } else if (err.response?.status === 401) {
                errorMessage = "Oturum süresi dolmuş, lütfen tekrar giriş yapın";
            } else {
                errorMessage = err.response?.data?.message || err.response?.data || err.message;
            }

            alert("Durum güncelleme hatası: " + errorMessage);
        }
    };

    const deleteProject = async (projeId) => {
        if (!window.confirm("Bu proje silinsin mi? Bu işlem geri alınamaz!")) return;

        try {
            await api.delete(`/api/projeler/${projeId}`, { headers: authHeaders() });
            alert("Proje silindi 🗑️");
            await loadProjelerData();
            if (refreshAll) await refreshAll();
        } catch (err) {
            console.error("Proje silme hatası:", err);
            alert("Silme hatası: " + (err.response?.data?.message || err.response?.data || err.message));
        }
    };

    const addEmployeeToProject = async (projeId) => {
        const calisanId = window.prompt("Hangi çalışan ID'si eklensin?");
        if (!calisanId) return;

        try {
            // Farklı endpoint formatlarını deneyelim
            const endpoints = [
                `/api/projeler/${projeId}/calisanlar/${calisanId}/ekle`,
                `/api/projeler/${projeId}/calisanlar`,
                `/api/projeler/${projeId}/employees/${calisanId}`
            ];

            let success = false;
            let lastError;

            for (const endpoint of endpoints) {
                try {
                    console.log(`Çalışan ekleme denemesi: POST ${endpoint}`);
                    await api.post(endpoint, {}, { headers: authHeaders() });
                    success = true;
                    break;
                } catch (err) {
                    console.log(`POST ${endpoint} başarısız:`, err.response?.status);
                    lastError = err;
                    if (err.response?.status !== 404 && err.response?.status !== 405) {
                        throw err;
                    }
                }
            }

            if (!success) {
                throw lastError || new Error("Tüm endpoint'ler başarısız");
            }

            alert("Çalışan projeye eklendi ✅");
            await loadProjelerData();
            if (refreshAll) await refreshAll();
        } catch (err) {
            console.error("Çalışan ekleme hatası:", err);
            const errorMessage = err.response?.data?.message || err.response?.data || err.message;
            alert("Ekleme hatası: " + errorMessage);
        }
    };

    const removeEmployeeFromProject = async (projeId) => {
        const calisanId = window.prompt("Hangi çalışan ID'si çıkarılsın?");
        if (!calisanId) return;

        try {
            // Farklı endpoint formatlarını deneyelim
            const endpoints = [
                `/api/projeler/${projeId}/calisanlar/${calisanId}/cikar`,
                `/api/projeler/${projeId}/calisanlar/${calisanId}`,
                `/api/projeler/${projeId}/employees/${calisanId}`
            ];

            let success = false;
            let lastError;

            for (const endpoint of endpoints) {
                try {
                    console.log(`Çalışan çıkarma denemesi: DELETE ${endpoint}`);
                    await api.delete(endpoint, { headers: authHeaders() });
                    success = true;
                    break;
                } catch (err) {
                    console.log(`DELETE ${endpoint} başarısız:`, err.response?.status);
                    lastError = err;
                    if (err.response?.status !== 404 && err.response?.status !== 405) {
                        throw err;
                    }
                }
            }

            if (!success) {
                throw lastError || new Error("Tüm endpoint'ler başarısız");
            }

            alert("Çalışan projeden çıkarıldı ✅");
            await loadProjelerData();
            if (refreshAll) await refreshAll();
        } catch (err) {
            console.error("Çalışan çıkarma hatası:", err);
            const errorMessage = err.response?.data?.message || err.response?.data || err.message;
            alert("Çıkarma hatası: " + errorMessage);
        }
    };

    // Loading durumu
    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <h3>📥 Proje verileri yükleniyor...</h3>
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
                    onClick={loadProjelerData}
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

    // Projeleri belirle - önce detay listesini, yoksa özetten
    const projelerListesi = projelerDetay.length > 0
        ? projelerDetay
        : (projelerOzet?.projeler || []);

    console.log("Render edilecek projeler:", projelerListesi);

    return (
        <div>
            <div style={{ marginBottom: '30px' }}>
                <h2 style={h2Style}>📋 Projeler Yönetimi</h2>
                <p style={{ color: '#666', marginBottom: '20px' }}>
                    <strong>Toplam Proje:</strong> {projelerOzet?.toplamProjeSayisi || projelerListesi.length || 0}
                </p>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    {(role === "ADMIN" || role === "USER") && (
                        <button
                            onClick={createProject}
                            style={{
                                padding: '10px 14px',
                                borderRadius: 8,
                                border: '1px solid #2ecc71',
                                background: '#2ecc71',
                                color: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            + Yeni Proje
                        </button>
                    )}
                    <button
                        onClick={loadProjelerData}
                        style={{
                            padding: '10px 14px',
                            borderRadius: 8,
                            border: '1px solid #3498db',
                            background: '#3498db',
                            color: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        🔄 Yenile
                    </button>
                </div>
            </div>

            {/* Proje İstatistikleri */}
            <div style={{ marginBottom: '30px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                    <StatCard
                        title="Toplam Proje"
                        value={projelerOzet?.toplamProjeSayisi || projelerListesi.length || 0}
                        color="#2ecc71"
                    />
                    {projelerOzet?.durumDagilimi && (
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

            {/* Debug Bilgisi */}
            <div style={{
                backgroundColor: '#f8f9fa',
                padding: '10px',
                borderRadius: '4px',
                marginBottom: '20px',
                fontSize: '12px',
                color: '#6c757d'
            }}>
                <strong>Debug:</strong> {projelerListesi.length} proje bulundu.
                Detay listesi: {projelerDetay.length},
                Özet listesi: {projelerOzet?.projeler?.length || 0}
            </div>

            {/* Durum Dağılımı */}
            {projelerOzet?.durumDagilimi && Object.keys(projelerOzet.durumDagilimi).length > 0 && (
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
            {projelerListesi.length > 0 ? (
                <div>
                    <h3 style={h3Style}>🚀 Tüm Projeler ({projelerListesi.length})</h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
                        gap: '20px'
                    }}>
                        {projelerListesi.map((proje, index) => (
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

                                {/* Proje Açıklaması */}
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

                                {/* Çalışan isimleri */}
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
                                            {proje.calisanlar.slice(0, 4).map((calisan, idx) => (
                                                <span key={idx} style={{
                                                    backgroundColor: '#3498db',
                                                    color: 'white',
                                                    padding: '3px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '11px',
                                                    fontWeight: '500'
                                                }}>
                                                    {calisan.ad
                                                        ? `${calisan.ad}${calisan.soyad ? ' ' + calisan.soyad : ''}`
                                                        : `ID: ${calisan.id || idx + 1}`
                                                    }
                                                </span>
                                            ))}
                                            {proje.calisanlar.length > 4 && (
                                                <span style={{
                                                    backgroundColor: '#95a5a6',
                                                    color: 'white',
                                                    padding: '3px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '11px',
                                                    fontWeight: '500'
                                                }}>
                                                    +{proje.calisanlar.length - 4} daha
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: 8, marginTop: 15, flexWrap: 'wrap' }}>
                                    <button
                                        onClick={() => addEmployeeToProject(proje.id)}
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: 8,
                                            border: '1px solid #2ecc71',
                                            background: '#2ecc71',
                                            color: 'white',
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                        }}
                                    >
                                        Çalışan Ekle
                                    </button>

                                    <button
                                        onClick={() => removeEmployeeFromProject(proje.id)}
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: 8,
                                            border: '1px solid #f39c12',
                                            background: '#f39c12',
                                            color: 'white',
                                            cursor: 'pointer',
                                            fontSize: '12px'
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
                                                    cursor: 'pointer',
                                                    fontSize: '12px'
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
                                                    cursor: 'pointer',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                Sil
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
                    <button
                        onClick={createProject}
                        style={{
                            padding: '12px 20px',
                            backgroundColor: '#2ecc71',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            marginTop: '10px'
                        }}
                    >
                        İlk Projeyi Ekle
                    </button>
                </div>
            )}
        </div>
    );
}