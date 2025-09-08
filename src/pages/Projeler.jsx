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
            const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
            if (!token) {
                setError("Token bulunamadı. Lütfen tekrar giriş yapın.");
                return;
            }

            const headers = authHeaders();
            console.log("Projeler API isteği gönderiliyor, headers:", headers);

            let projelerData = [];
            let projelerOzetData = null;

            try {
                // ADMIN ise tüm projeleri, USER ise kendi projelerini getir
                const endpoint = role === "ADMIN" ? "/api/projeler" : "/api/projeler/my-projects";
                const projelerRes = await api.get(endpoint, { headers });

                // Controller response formatına göre veriyi al
                if (projelerRes.data.success) {
                    projelerData = projelerRes.data.data;
                } else {
                    projelerData = projelerRes.data;
                }

                console.log("Projeler verisi:", projelerData);
            } catch (err) {
                console.warn("Projeler endpoint hatası:", err.response?.status, err.response?.data);
            }

            try {
                // Dashboard özet bilgiler - USER için farklı endpoint
                const ozetEndpoint = role === "ADMIN"
                    ? "/api/dashboard/projeler-ozet"
                    : "/api/projeler/user-projects";

                const ozetRes = await api.get(ozetEndpoint, { headers });
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
    }, [role]); // role değiştiğinde de yeniden yükle

    const createProject = async () => {
        // Sadece ADMIN proje oluşturabilir
        if (role !== "ADMIN") {
            alert("Proje oluşturmak için admin yetkisi gerekiyor!");
            return;
        }

        // Token kontrolü
        const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
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
                    timeout: 10000
                }
            );

            console.log("Proje ekleme response:", response.data);

            // Controller response formatına göre mesaj göster
            if (response.data.success) {
                alert("Proje başarıyla eklendi! ✅");
            } else {
                alert("Proje eklendi ✅");
            }

            await loadProjelerData();
            if (refreshAll) await refreshAll();
        } catch (err) {
            console.error("Proje ekleme hatası:", err);
            console.error("Error response:", err.response);

            let errorMessage = "Bilinmeyen hata";

            if (err.response?.status === 401) {
                errorMessage = "Yetki hatası. Lütfen tekrar deneyin veya girşi yapın.";
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
        // Sadece ADMIN durum güncelleyebilir
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

        if (newStatus === currentStatus) {
            alert("Seçilen durum mevcut durumla aynı.");
            return;
        }

        try {
            console.log("Durum güncelleme isteği gönderiliyor:", {
                projeId,
                currentStatus,
                newStatus
            });

            // Controller'da tanımlı endpoint'leri sırayla deneyelim
            let response;
            const endpoints = [
                { url: `/api/projeler/${projeId}/durum`, method: 'put', data: { durum: newStatus } },
                { url: `/api/projeler/${projeId}/durum`, method: 'patch', data: { durum: newStatus } },
                { url: `/api/projeler/${projeId}`, method: 'put', data: { durum: newStatus } }
            ];

            let lastError;

            for (const endpoint of endpoints) {
                try {
                    console.log(`Denenen: ${endpoint.method.toUpperCase()} ${endpoint.url}`);
                    response = await api[endpoint.method](
                        endpoint.url,
                        endpoint.data,
                        { headers: authHeaders() }
                    );
                    console.log("Başarılı response:", response.data);
                    break;
                } catch (err) {
                    console.log(`${endpoint.method.toUpperCase()} ${endpoint.url} başarısız:`, err.response?.status);
                    lastError = err;
                    if (err.response?.status !== 404 && err.response?.status !== 405) {
                        throw err;
                    }
                }
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
        // Sadece ADMIN proje silebilir
        if (role !== "ADMIN") {
            alert("Bu işlem için admin yetkisi gerekiyor!");
            return;
        }

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
        // Sadece ADMIN çalışan ekleyebilir
        if (role !== "ADMIN") {
            alert("Bu işlem için admin yetkisi gerekiyor!");
            return;
        }

        const calisanId = window.prompt("Hangi çalışan ID'si eklensin?");
        if (!calisanId) return;

        try {
            // Controller'da tanımlı exact endpoint
            const endpoint = `/api/projeler/${projeId}/calisanlar/${calisanId}/ekle`;

            console.log(`Çalışan ekleme: POST ${endpoint}`);
            await api.post(endpoint, {}, { headers: authHeaders() });

            alert("Çalışan projeye eklendi ✅");
            await loadProjelerData();
            if (refreshAll) await refreshAll();
        } catch (err) {
            console.error("Çalışan ekleme hatası:", err);
            let errorMessage = "Bilinmeyen hata";

            if (err.response?.status === 403) {
                errorMessage = "Bu işlem için yetkiniz yok";
            } else if (err.response?.status === 404) {
                errorMessage = "Proje veya çalışan bulunamadı";
            } else if (err.response?.status === 400) {
                errorMessage = "Geçersiz çalışan ID'si";
            } else {
                errorMessage = err.response?.data?.message || err.response?.data || err.message;
            }

            alert("Ekleme hatası: " + errorMessage);
        }
    };

    const removeEmployeeFromProject = async (projeId) => {
        // Sadece ADMIN çalışan çıkarabilir
        if (role !== "ADMIN") {
            alert("Bu işlem için admin yetkisi gerekiyor!");
            return;
        }

        const calisanId = window.prompt("Hangi çalışan ID'si çıkarılsın?");
        if (!calisanId) return;

        try {
            // Controller'da tanımlı exact endpoint
            const endpoint = `/api/projeler/${projeId}/calisanlar/${calisanId}/cikar`;

            console.log(`Çalışan çıkarma: DELETE ${endpoint}`);
            await api.delete(endpoint, { headers: authHeaders() });

            alert("Çalışan projeden çıkarıldı ✅");
            await loadProjelerData();
            if (refreshAll) await refreshAll();
        } catch (err) {
            console.error("Çalışan çıkarma hatası:", err);
            let errorMessage = "Bilinmeyen hata";

            if (err.response?.status === 403) {
                errorMessage = "Bu işlem için yetkiniz yok";
            } else if (err.response?.status === 404) {
                errorMessage = "Proje veya çalışan bulunamadı";
            } else if (err.response?.status === 400) {
                errorMessage = "Geçersiz çalışan ID'si";
            } else {
                errorMessage = err.response?.data?.message || err.response?.data || err.message;
            }

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
                <h2 style={h2Style}>
                    📋 {role === "ADMIN" ? "Projeler Yönetimi" : "Projelerim"}
                </h2>
                <p style={{ color: '#666', marginBottom: '20px' }}>
                    <strong>
                        {role === "ADMIN" ? "Toplam Proje:" : "Atandığınız Proje Sayısı:"}
                    </strong> {projelerOzet?.toplamProjeSayisi || projelerListesi.length || 0}
                </p>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    {role === "ADMIN" && (
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
                        title={role === "ADMIN" ? "Toplam Proje" : "Projelerim"}
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
                Role: {role}, Detay listesi: {projelerDetay.length},
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
                    <h3 style={h3Style}>🚀 {role === "ADMIN" ? "Tüm Projeler" : "Projelerim"} ({projelerListesi.length})</h3>
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

                                {/* Action Buttons - Role bazlı kontrol */}
                                <div style={{ display: 'flex', gap: 8, marginTop: 15, flexWrap: 'wrap' }}>
                                    {role === "ADMIN" && (
                                        <>
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

                                    {/* USER için sadece proje detay görme butonu */}
                                    {role === "USER" && (
                                        <button
                                            onClick={() => alert(`Proje ID: ${proje.id}\nBaşlık: ${proje.baslik}\nDurum: ${proje.durum}`)}
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: 8,
                                                border: '1px solid #3498db',
                                                background: '#3498db',
                                                color: 'white',
                                                cursor: 'pointer',
                                                fontSize: '12px'
                                            }}
                                        >
                                            Detay Görüntüle
                                        </button>
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
                    <h3 style={{ color: '#7f8c8d' }}>📭 {role === "ADMIN" ? "Henüz proje bulunmuyor" : "Size atanan proje bulunmuyor"}</h3>
                    <p style={{ color: '#bdc3c7' }}>
                        {role === "ADMIN"
                            ? "Sisteme proje eklendikçe burada görünecektir."
                            : "Size atanan projeler burada görünecektir."
                        }
                    </p>
                    {role === "ADMIN" && (
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
                    )}
                </div>
            )}
        </div>
    );
}