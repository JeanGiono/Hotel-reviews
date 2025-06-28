// 旅館評價地圖系統 - 主要應用程式
class HotelReviewApp {
    constructor() {
        // 應用程式狀態
        this.hotels = [];
        this.map = null;
        this.markers = [];
        this.currentEditingId = null;
        this.selectedMarker = null;
        this.isAddingMode = false;
        this.tempMarker = null;

        // 初始化應用程式
        this.init();
    }

    // 初始化應用程式
    async init() {
        try {
            // 確保載入指示器隱藏
            this.hideLoading();
            
            this.loadInitialData();
            await this.initMap();
            this.bindEvents();
            this.renderReviewsList();
            this.updateStats();
            
            console.log('應用程式初始化完成');
        } catch (error) {
            console.error('應用程式初始化失敗:', error);
            this.showNotification('應用程式載入失敗，請重新整理頁面', 'error');
        }
    }

    // 載入初始資料
    loadInitialData() {
        this.hotels = [
            {
                id: 1625123456789,
                name: "Wego Motel Taipei",
                isFavorite: true,
                imageUrl: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&h=400&fit=crop",
                category: "情侶專用",
                price: "$$$",
                lat: 25.0570,
                lng: 121.5260,
                visitedDate: "2024-05-20",
                pros: "知名情侶汽車旅館\n主題房型多、私密性高\n設施新穎齊全",
                cons: "價格偏高\n預訂困難",
                rating_cleanliness: 4,
                rating_privacy: 5,
                rating_security: 5,
                rating_network: 4,
                rating_service: 4,
                rating_atmosphere: 5,
                rating_facilities_couple: 5,
                rating_creativity: 5
            },
            {
                id: 1625235467890,
                name: "探索汽車旅館-南港館",
                isFavorite: false,
                imageUrl: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600&h=400&fit=crop",
                category: "情侶專用",
                price: "$$$",
                lat: 25.0550,
                lng: 121.6100,
                visitedDate: "2024-03-10",
                pros: "汽車旅館型態，房型多元\n高度隱私\n交通方便",
                cons: "部分設施較舊\n周邊環境普通",
                rating_cleanliness: 4,
                rating_privacy: 5,
                rating_security: 5,
                rating_network: 4,
                rating_service: 3,
                rating_atmosphere: 4,
                rating_facilities_couple: 4,
                rating_creativity: 4
            },
            {
                id: 1625346578901,
                name: "Hotel East Taipei",
                isFavorite: false,
                imageUrl: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&h=400&fit=crop",
                category: "設計旅店",
                price: "$$$",
                lat: 25.0480,
                lng: 121.5600,
                visitedDate: "2023-12-25",
                pros: "現代設計風格\n設有屋頂花園\n服務品質優良",
                cons: "房間偏小\n價格偏高",
                rating_cleanliness: 5,
                rating_privacy: 4,
                rating_security: 4,
                rating_network: 5,
                rating_service: 5,
                rating_atmosphere: 5,
                rating_facilities_couple: 2,
                rating_creativity: 4
            }
        ];
    }

    // 初始化地圖
    async initMap() {
        try {
            // 等待 Leaflet 完全載入
            if (typeof L === 'undefined') {
                throw new Error('Leaflet 未載入');
            }

            // 創建地圖，以台北為中心
            this.map = L.map('map').setView([25.0330, 121.5654], 11);

            // 添加圖層
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 18
            }).addTo(this.map);

            // 等待地圖完全載入
            await new Promise((resolve) => {
                this.map.whenReady(() => {
                    resolve();
                });
            });

            // 添加所有旅館標記
            this.addAllMarkers();

            // 地圖點擊事件（新增評價模式）
            this.map.on('click', (e) => {
                if (this.isAddingMode) {
                    this.handleMapClick(e);
                }
            });

            console.log('地圖初始化完成');
        } catch (error) {
            console.error('地圖初始化失敗:', error);
            throw error;
        }
    }

    // 添加所有標記到地圖
    addAllMarkers() {
        this.clearMarkers();
        this.hotels.forEach(hotel => {
            this.addMarker(hotel);
        });
    }

    // 添加單個標記
    addMarker(hotel) {
        try {
            const marker = L.marker([hotel.lat, hotel.lng])
                .addTo(this.map)
                .bindPopup(this.createPopupContent(hotel))
                .on('click', () => {
                    this.selectHotel(hotel.id);
                });

            // 自定義標記圖標（根據分類）
            marker.setIcon(this.getMarkerIcon(hotel.category, hotel.isFavorite));
            
            this.markers.push({ id: hotel.id, marker: marker });
        } catch (error) {
            console.error('添加標記失敗:', error);
        }
    }

    // 獲取標記圖標
    getMarkerIcon(category, isFavorite) {
        const iconColor = this.getCategoryColor(category);
        const iconHtml = isFavorite ? 
            `<i class="fas fa-heart" style="color: #e74c3c; font-size: 20px;"></i>` : 
            `<i class="fas fa-map-marker-alt" style="color: ${iconColor}; font-size: 20px;"></i>`;

        return L.divIcon({
            html: iconHtml,
            iconSize: [25, 25],
            iconAnchor: [12, 25],
            popupAnchor: [0, -25],
            className: 'custom-marker'
        });
    }

    // 獲取分類顏色
    getCategoryColor(category) {
        const colors = {
            '情侶專用': '#e91e63',
            '設計旅店': '#9c27b0',
            '豪華享受': '#f44336',
            '溫泉度假': '#ff9800',
            '商務旅行': '#2196f3',
            '家庭親子': '#4caf50'
        };
        return colors[category] || '#757575';
    }

    // 創建彈出視窗內容
    createPopupContent(hotel) {
        const avgRating = this.calculateAverageRating(hotel);
        return `
            <div style="min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px;">${hotel.name}</h3>
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">
                    <span style="background: ${this.getCategoryColor(hotel.category)}; color: white; padding: 2px 6px; border-radius: 12px; font-size: 10px;">${hotel.category}</span>
                    <span style="margin-left: 8px;">${hotel.price}</span>
                </p>
                <div style="margin: 8px 0;">
                    <span style="color: #ffd700;">★★★★★</span>
                    <span style="margin-left: 4px; font-size: 12px;">${avgRating.toFixed(1)}</span>
                </div>
                <button onclick="window.appInstance.showHotelDetail(${hotel.id})" style="background: #2196f3; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: pointer;">查看詳情</button>
            </div>
        `;
    }

    // 清除所有標記
    clearMarkers() {
        this.markers.forEach(item => {
            if (this.map && item.marker) {
                this.map.removeLayer(item.marker);
            }
        });
        this.markers = [];
    }

    // 綁定事件處理程序
    bindEvents() {
        try {
            // 新增評價按鈕
            const addReviewBtn = document.getElementById('addReviewBtn');
            if (addReviewBtn) {
                addReviewBtn.addEventListener('click', () => {
                    this.startAddingMode();
                });
            }

            // 搜尋輸入
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    this.handleSearch(e.target.value);
                });
            }

            // 篩選器
            const filters = ['categoryFilter', 'priceFilter', 'sortBy'];
            filters.forEach(filterId => {
                const element = document.getElementById(filterId);
                if (element) {
                    element.addEventListener('change', () => {
                        this.applyFilters();
                    });
                }
            });

            const favoritesOnly = document.getElementById('favoritesOnly');
            if (favoritesOnly) {
                favoritesOnly.addEventListener('change', () => {
                    this.applyFilters();
                });
            }

            // 模態框事件
            this.bindModalEvents();

            // 星級評分事件
            this.bindStarRatingEvents();

            console.log('事件綁定完成');
        } catch (error) {
            console.error('事件綁定失敗:', error);
        }
    }

    // 綁定模態框事件
    bindModalEvents() {
        try {
            // 評價表單模態框
            const closeModal = document.getElementById('closeModal');
            const cancelBtn = document.getElementById('cancelBtn');
            if (closeModal) closeModal.addEventListener('click', () => this.hideModal('reviewModal'));
            if (cancelBtn) cancelBtn.addEventListener('click', () => this.hideModal('reviewModal'));

            // 詳情模態框
            const closeDetailModal = document.getElementById('closeDetailModal');
            const closeDetailBtn = document.getElementById('closeDetailBtn');
            const editDetailBtn = document.getElementById('editDetailBtn');
            const deleteDetailBtn = document.getElementById('deleteDetailBtn');
            
            if (closeDetailModal) closeDetailModal.addEventListener('click', () => this.hideModal('detailModal'));
            if (closeDetailBtn) closeDetailBtn.addEventListener('click', () => this.hideModal('detailModal'));
            if (editDetailBtn) editDetailBtn.addEventListener('click', () => this.editCurrentHotel());
            if (deleteDetailBtn) deleteDetailBtn.addEventListener('click', () => this.showDeleteConfirm());

            // 確認刪除模態框
            const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
            const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
            if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', () => this.hideModal('confirmModal'));
            if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', () => this.deleteCurrentHotel());

            // 表單提交
            const reviewForm = document.getElementById('reviewForm');
            if (reviewForm) {
                reviewForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleFormSubmit();
                });
            }

            // 點擊模態框背景關閉
            ['reviewModal', 'detailModal', 'confirmModal'].forEach(modalId => {
                const modal = document.getElementById(modalId);
                if (modal) {
                    modal.addEventListener('click', (e) => {
                        if (e.target.id === modalId) {
                            this.hideModal(modalId);
                        }
                    });
                }
            });
        } catch (error) {
            console.error('模態框事件綁定失敗:', error);
        }
    }

    // 綁定星級評分事件
    bindStarRatingEvents() {
        document.querySelectorAll('.star-rating').forEach(ratingContainer => {
            const stars = ratingContainer.querySelectorAll('.star');
            const ratingType = ratingContainer.dataset.rating;

            stars.forEach((star, index) => {
                star.addEventListener('mouseenter', () => {
                    this.highlightStars(stars, index + 1);
                });

                star.addEventListener('mouseleave', () => {
                    const currentRating = ratingContainer.dataset.currentRating || 0;
                    this.highlightStars(stars, currentRating);
                });

                star.addEventListener('click', () => {
                    const rating = index + 1;
                    ratingContainer.dataset.currentRating = rating;
                    this.highlightStars(stars, rating);
                });
            });
        });
    }

    // 高亮星星
    highlightStars(stars, rating) {
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    // 開始新增模式
    startAddingMode() {
        this.isAddingMode = true;
        this.showModal('reviewModal');
        this.resetForm();
        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) modalTitle.textContent = '新增旅館評價';
        
        // 顯示地圖指示
        this.showNotification('請在地圖上點擊選擇旅館位置', 'info');
    }

    // 處理地圖點擊
    handleMapClick(e) {
        const { lat, lng } = e.latlng;
        
        // 移除之前的臨時標記
        if (this.tempMarker) {
            this.map.removeLayer(this.tempMarker);
        }

        // 添加臨時標記
        this.tempMarker = L.marker([lat, lng])
            .addTo(this.map)
            .bindPopup('新旅館位置')
            .openPopup();

        // 設置表單中的座標
        const hotelLat = document.getElementById('hotelLat');
        const hotelLng = document.getElementById('hotelLng');
        if (hotelLat) hotelLat.value = lat;
        if (hotelLng) hotelLng.value = lng;

        this.showNotification('位置已選擇，請填寫旅館資訊', 'success');
    }

    // 處理搜尋
    handleSearch(query) {
        const filteredHotels = this.hotels.filter(hotel =>
            hotel.name.toLowerCase().includes(query.toLowerCase())
        );
        this.renderReviewsList(filteredHotels);
    }

    // 應用篩選器
    applyFilters() {
        const categoryFilter = document.getElementById('categoryFilter');
        const priceFilter = document.getElementById('priceFilter');
        const sortBy = document.getElementById('sortBy');
        const favoritesOnly = document.getElementById('favoritesOnly');
        const searchInput = document.getElementById('searchInput');

        const category = categoryFilter ? categoryFilter.value : '';
        const price = priceFilter ? priceFilter.value : '';
        const sortByValue = sortBy ? sortBy.value : 'rating';
        const favoritesOnlyValue = favoritesOnly ? favoritesOnly.checked : false;
        const searchQuery = searchInput ? searchInput.value.toLowerCase() : '';

        let filteredHotels = this.hotels.filter(hotel => {
            // 分類篩選
            if (category && hotel.category !== category) return false;
            
            // 價位篩選
            if (price && hotel.price !== price) return false;
            
            // 收藏篩選
            if (favoritesOnlyValue && !hotel.isFavorite) return false;
            
            // 搜尋篩選
            if (searchQuery && !hotel.name.toLowerCase().includes(searchQuery)) return false;
            
            return true;
        });

        // 排序
        filteredHotels.sort((a, b) => {
            switch (sortByValue) {
                case 'rating':
                    return this.calculateAverageRating(b) - this.calculateAverageRating(a);
                case 'date':
                    return new Date(b.visitedDate) - new Date(a.visitedDate);
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'price':
                    const priceOrder = { '$': 1, '$$': 2, '$$$': 3, '$$$$': 4 };
                    return priceOrder[a.price] - priceOrder[b.price];
                default:
                    return 0;
            }
        });

        this.renderReviewsList(filteredHotels);
    }

    // 渲染評價清單
    renderReviewsList(hotelsToShow = this.hotels) {
        const listContainer = document.getElementById('reviewsList');
        const listCount = document.getElementById('listCount');
        
        if (listCount) listCount.textContent = hotelsToShow.length;

        if (!listContainer) return;

        if (hotelsToShow.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>沒有找到符合條件的評價</h3>
                    <p>請嘗試調整篩選條件或搜尋關鍵字</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = hotelsToShow.map(hotel => {
            const avgRating = this.calculateAverageRating(hotel);
            const starsHtml = this.generateStarsHtml(avgRating);
            
            return `
                <div class="review-card" data-id="${hotel.id}" onclick="window.appInstance.selectHotel(${hotel.id})">
                    <div class="review-header">
                        <h3 class="review-title">${hotel.name}</h3>
                        <button class="favorite-btn ${hotel.isFavorite ? 'active' : ''}" 
                                onclick="window.appInstance.toggleFavorite(${hotel.id}, event)">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                    <div class="review-meta">
                        <span class="category-badge" style="background-color: ${this.getCategoryColor(hotel.category)}">
                            ${hotel.category}
                        </span>
                        <span class="price-badge">${hotel.price}</span>
                    </div>
                    <div class="review-rating">
                        <span class="rating-stars">${starsHtml}</span>
                        <span class="rating-number">${avgRating.toFixed(1)}</span>
                    </div>
                    <div class="review-date">造訪日期：${hotel.visitedDate}</div>
                </div>
            `;
        }).join('');
    }

    // 生成星星HTML
    generateStarsHtml(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        let starsHtml = '';

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                starsHtml += '★';
            } else if (i === fullStars && hasHalfStar) {
                starsHtml += '☆';
            } else {
                starsHtml += '☆';
            }
        }
        return starsHtml;
    }

    // 計算平均評分
    calculateAverageRating(hotel) {
        const ratings = [
            hotel.rating_cleanliness,
            hotel.rating_privacy,
            hotel.rating_security,
            hotel.rating_network,
            hotel.rating_service,
            hotel.rating_atmosphere,
            hotel.rating_facilities_couple,
            hotel.rating_creativity
        ];
        const sum = ratings.reduce((acc, rating) => acc + rating, 0);
        return sum / ratings.length;
    }

    // 選擇旅館
    selectHotel(hotelId) {
        // 更新清單中的選中狀態
        document.querySelectorAll('.review-card').forEach(card => {
            card.classList.remove('active');
        });
        const selectedCard = document.querySelector(`[data-id="${hotelId}"]`);
        if (selectedCard) selectedCard.classList.add('active');

        // 在地圖上高亮標記
        this.highlightMarker(hotelId);
        
        // 顯示詳情
        this.showHotelDetail(hotelId);
    }

    // 高亮地圖標記
    highlightMarker(hotelId) {
        const hotel = this.hotels.find(h => h.id === hotelId);
        if (hotel && this.map) {
            this.map.setView([hotel.lat, hotel.lng], 15);
            const markerItem = this.markers.find(m => m.id === hotelId);
            if (markerItem) {
                markerItem.marker.openPopup();
            }
        }
    }

    // 顯示旅館詳情
    showHotelDetail(hotelId) {
        const hotel = this.hotels.find(h => h.id === hotelId);
        if (!hotel) return;

        this.currentEditingId = hotelId;
        
        // 設置模態框標題
        const detailTitle = document.getElementById('detailTitle');
        if (detailTitle) detailTitle.textContent = hotel.name;
        
        // 生成詳情內容
        const avgRating = this.calculateAverageRating(hotel);
        const detailContent = document.getElementById('detailContent');
        
        if (detailContent) {
            detailContent.innerHTML = `
                <div class="detail-section">
                    <h4>基本資訊</h4>
                    <div class="detail-info">
                        <div class="detail-item">
                            <span class="detail-label">分類</span>
                            <span class="detail-value">${hotel.category}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">價位</span>
                            <span class="detail-value">${hotel.price}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">造訪日期</span>
                            <span class="detail-value">${hotel.visitedDate}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">綜合評分</span>
                            <span class="detail-value">${avgRating.toFixed(1)} / 5.0</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>住宿品質評分</h4>
                    <div class="detail-info">
                        <div class="detail-item">
                            <span class="detail-label">房間清潔度</span>
                            <span class="detail-value">${this.generateStarsHtml(hotel.rating_cleanliness)} ${hotel.rating_cleanliness}/5</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">隱私性</span>
                            <span class="detail-value">${this.generateStarsHtml(hotel.rating_privacy)} ${hotel.rating_privacy}/5</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">安全性</span>
                            <span class="detail-value">${this.generateStarsHtml(hotel.rating_security)} ${hotel.rating_security}/5</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">網路速度</span>
                            <span class="detail-value">${this.generateStarsHtml(hotel.rating_network)} ${hotel.rating_network}/5</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">員工服務</span>
                            <span class="detail-value">${this.generateStarsHtml(hotel.rating_service)} ${hotel.rating_service}/5</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>情侶體驗評分</h4>
                    <div class="detail-info">
                        <div class="detail-item">
                            <span class="detail-label">浪漫氛圍</span>
                            <span class="detail-value">${this.generateStarsHtml(hotel.rating_atmosphere)} ${hotel.rating_atmosphere}/5</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">私密設施</span>
                            <span class="detail-value">${this.generateStarsHtml(hotel.rating_facilities_couple)} ${hotel.rating_facilities_couple}/5</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">房型創意</span>
                            <span class="detail-value">${this.generateStarsHtml(hotel.rating_creativity)} ${hotel.rating_creativity}/5</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>優點</h4>
                    <div class="detail-text">${hotel.pros || '無'}</div>
                </div>
                
                <div class="detail-section">
                    <h4>缺點</h4>
                    <div class="detail-text">${hotel.cons || '無'}</div>
                </div>
            `;
        }
        
        this.showModal('detailModal');
    }

    // 切換收藏狀態
    toggleFavorite(hotelId, event) {
        event.stopPropagation();
        
        const hotel = this.hotels.find(h => h.id === hotelId);
        if (hotel) {
            hotel.isFavorite = !hotel.isFavorite;
            
            // 更新地圖標記
            this.addAllMarkers();
            
            // 重新渲染清單
            this.applyFilters();
            
            // 更新統計
            this.updateStats();
            
            this.showNotification(
                hotel.isFavorite ? '已加入收藏' : '已移除收藏',
                'success'
            );
        }
    }

    // 其他方法保持不變...
    editCurrentHotel() {
        if (!this.currentEditingId) return;
        
        const hotel = this.hotels.find(h => h.id === this.currentEditingId);
        if (!hotel) return;

        this.hideModal('detailModal');
        this.showModal('reviewModal');
        
        // 設置表單標題
        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) modalTitle.textContent = '編輯旅館評價';
        
        // 填充表單數據
        this.populateForm(hotel);
    }

    populateForm(hotel) {
        const elements = {
            'hotelName': hotel.name,
            'hotelCategory': hotel.category,
            'hotelPrice': hotel.price,
            'visitDate': hotel.visitedDate,
            'pros': hotel.pros,
            'cons': hotel.cons,
            'hotelLat': hotel.lat,
            'hotelLng': hotel.lng,
            'editingId': hotel.id
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.value = value;
        });

        // 設置星級評分
        const ratings = {
            'cleanliness': hotel.rating_cleanliness,
            'privacy': hotel.rating_privacy,
            'security': hotel.rating_security,
            'network': hotel.rating_network,
            'service': hotel.rating_service,
            'atmosphere': hotel.rating_atmosphere,
            'facilities_couple': hotel.rating_facilities_couple,
            'creativity': hotel.rating_creativity
        };

        Object.entries(ratings).forEach(([ratingType, value]) => {
            const ratingContainer = document.querySelector(`[data-rating="${ratingType}"]`);
            if (ratingContainer) {
                ratingContainer.dataset.currentRating = value;
                const stars = ratingContainer.querySelectorAll('.star');
                this.highlightStars(stars, value);
            }
        });
    }

    resetForm() {
        const form = document.getElementById('reviewForm');
        if (form) form.reset();
        
        const editingId = document.getElementById('editingId');
        if (editingId) editingId.value = '';
        
        // 重置星級評分
        document.querySelectorAll('.star-rating').forEach(ratingContainer => {
            ratingContainer.dataset.currentRating = 0;
            const stars = ratingContainer.querySelectorAll('.star');
            this.highlightStars(stars, 0);
        });

        // 移除臨時標記
        if (this.tempMarker && this.map) {
            this.map.removeLayer(this.tempMarker);
            this.tempMarker = null;
        }

        this.isAddingMode = false;
    }

    handleFormSubmit() {
        const formData = this.getFormData();
        
        if (!this.validateForm(formData)) {
            return;
        }

        this.showLoading();

        // 模擬保存延遲
        setTimeout(() => {
            try {
                const editingId = document.getElementById('editingId');
                const editingIdValue = editingId ? editingId.value : '';
                
                if (editingIdValue) {
                    // 編輯現有評價
                    this.updateHotel(parseInt(editingIdValue), formData);
                    this.showNotification('評價已更新！', 'success');
                } else {
                    // 新增評價
                    this.addHotel(formData);
                    this.showNotification('評價已新增！', 'success');
                }

                this.hideModal('reviewModal');
                this.resetForm();
                this.addAllMarkers();
                this.renderReviewsList();
                this.updateStats();
                
            } catch (error) {
                this.showNotification('保存失敗，請重試', 'error');
                console.error('Save error:', error);
            } finally {
                this.hideLoading();
            }
        }, 1000);
    }

    getFormData() {
        const ratings = {};
        document.querySelectorAll('.star-rating').forEach(ratingContainer => {
            const ratingType = ratingContainer.dataset.rating;
            const currentRating = parseInt(ratingContainer.dataset.currentRating) || 0;
            ratings[`rating_${ratingType}`] = currentRating;
        });

        const getValue = (id) => {
            const element = document.getElementById(id);
            return element ? element.value.trim() : '';
        };

        return {
            name: getValue('hotelName'),
            category: getValue('hotelCategory'),
            price: getValue('hotelPrice'),
            visitedDate: getValue('visitDate'),
            pros: getValue('pros'),
            cons: getValue('cons'),
            lat: parseFloat(getValue('hotelLat')),
            lng: parseFloat(getValue('hotelLng')),
            isFavorite: false,
            ...ratings
        };
    }

    validateForm(formData) {
        const errors = [];

        if (!formData.name) errors.push('請輸入旅館名稱');
        if (!formData.category) errors.push('請選擇分類');
        if (!formData.price) errors.push('請選擇價位');
        if (!formData.visitedDate) errors.push('請選擇造訪日期');
        if (!formData.lat || !formData.lng) errors.push('請在地圖上選擇位置');

        // 檢查是否所有評分都已設置
        const ratingKeys = Object.keys(formData).filter(key => key.startsWith('rating_'));
        const unratedItems = ratingKeys.filter(key => !formData[key] || formData[key] === 0);
        
        if (unratedItems.length > 0) {
            errors.push('請完成所有項目的評分');
        }

        if (errors.length > 0) {
            this.showNotification(errors.join('\n'), 'error');
            return false;
        }

        return true;
    }

    addHotel(hotelData) {
        const newHotel = {
            id: Date.now(),
            imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop",
            ...hotelData
        };
        
        this.hotels.push(newHotel);
    }

    updateHotel(hotelId, hotelData) {
        const hotelIndex = this.hotels.findIndex(h => h.id === hotelId);
        if (hotelIndex !== -1) {
            this.hotels[hotelIndex] = {
                ...this.hotels[hotelIndex],
                ...hotelData
            };
        }
    }

    showDeleteConfirm() {
        this.hideModal('detailModal');
        this.showModal('confirmModal');
    }

    deleteCurrentHotel() {
        if (!this.currentEditingId) return;

        this.showLoading();

        setTimeout(() => {
            try {
                const hotelIndex = this.hotels.findIndex(h => h.id === this.currentEditingId);
                if (hotelIndex !== -1) {
                    this.hotels.splice(hotelIndex, 1);
                }

                this.hideModal('confirmModal');
                this.addAllMarkers();
                this.renderReviewsList();
                this.updateStats();
                this.showNotification('評價已刪除', 'success');
                
            } catch (error) {
                this.showNotification('刪除失敗，請重試', 'error');
                console.error('Delete error:', error);
            } finally {
                this.hideLoading();
            }
        }, 500);
    }

    updateStats() {
        const totalCount = this.hotels.length;
        const favoriteCount = this.hotels.filter(h => h.isFavorite).length;
        const avgRating = totalCount > 0 ? 
            this.hotels.reduce((sum, hotel) => sum + this.calculateAverageRating(hotel), 0) / totalCount : 0;

        const elements = {
            'totalCount': totalCount,
            'avgRating': avgRating.toFixed(1),
            'favoriteCount': favoriteCount
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
        
        if (modalId === 'reviewModal') {
            this.isAddingMode = false;
            if (this.tempMarker && this.map) {
                this.map.removeLayer(this.tempMarker);
                this.tempMarker = null;
            }
        }
    }

    showLoading() {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.classList.remove('hidden');
        }
    }

    hideLoading() {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.classList.add('hidden');
        }
    }

    showNotification(message, type = 'info') {
        // 創建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 20000;
            max-width: 300px;
            word-wrap: break-word;
            white-space: pre-line;
            animation: slideInRight 0.3s ease-out;
        `;

        // 設置背景顏色
        const colors = {
            success: '#4caf50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196f3'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        notification.textContent = message;
        document.body.appendChild(notification);

        // 自動移除通知
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// 添加 CSS 動畫（如果需要）
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .custom-marker {
        background: transparent;
        border: none;
    }
`;
document.head.appendChild(style);

// 初始化應用程式
let appInstance;
document.addEventListener('DOMContentLoaded', () => {
    try {
        appInstance = new HotelReviewApp();
        
        // 設置全域實例供 HTML 使用
        window.appInstance = appInstance;
        
        console.log('應用程式準備完成');
    } catch (error) {
        console.error('應用程式初始化失敗:', error);
    }
});