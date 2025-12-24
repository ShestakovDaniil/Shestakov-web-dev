// JavaScript для страницы "Собрать ланч" MosFood
// Обновлено с интеграцией API

// Загружаем данные блюд из API
async function loadDishesFromAPI() {
    console.log('Загрузка блюд с API...');
    
    try {
        if (!window.MosFoodAPI || !window.MosFoodAPI.getApiKey()) {
            console.warn('API ключ не установлен, используем локальные данные');
            loadSampleDishes();
            return;
        }
        
        const dishes = await window.MosFoodAPI.getAllDishes();
        
        if (!dishes || dishes.length === 0) {
            console.warn('Блюд не получено, используем локальные данные');
            loadSampleDishes();
            return;
        }
        
        console.log(`Получено ${dishes.length} блюд с API`);
        
        // Группируем блюда по категориям
        const groupedDishes = groupDishesByCategory(dishes);
        
        // Очищаем существующие блюда
        clearExistingDishes();
        
        // Заполняем секции
        populateDishesSections(groupedDishes);
        
        // Инициализируем кнопки добавления
        initAddButtonsAfterLoad();
        
        // Сортировка
        sortDishesAlphabetically();
        
        // Уведомление
        showNotification(`Загружено ${dishes.length} блюд с сервера`, 'success');
        
    } catch (error) {
        console.error('Ошибка загрузки блюд с API:', error);
        showNotification('Ошибка загрузки меню. Используются локальные данные.', 'error');
        loadSampleDishes();
    }
}

// Группировка блюд по категориям из API
function groupDishesByCategory(dishes) {
    const grouped = {
        salad: [],
        soup: [],
        main: [],
        drink: [],
        dessert: []
    };
    
    dishes.forEach(dish => {
        if (dish.category === 'salad') grouped.salad.push(dish);
        else if (dish.category === 'soup') grouped.soup.push(dish);
        else if (dish.category === 'main') grouped.main.push(dish);
        else if (dish.category === 'drink') grouped.drink.push(dish);
        else if (dish.category === 'dessert') grouped.dessert.push(dish);
    });
    
    return grouped;
}

// Создание карточки блюда с данными API
function createDishCardFromApi(dish, category) {
    const card = document.createElement('div');
    card.className = 'dish-card';
    card.dataset.category = category;
    card.dataset.dishId = dish.id;
    card.dataset.tags = dish.tags || '';
    
    const buttonLabel = getButtonLabelForCategory(category);
    
    const img = document.createElement('img');
    img.src = dish.image_url || getDefaultImage(category);
    img.alt = dish.name;
    img.className = 'dish-image-real';
    img.onerror = function() {
        this.src = getDefaultImage(category);
    };
    
    const namePara = document.createElement('p');
    namePara.className = 'dish-name';
    namePara.textContent = dish.name;
    
    const weightPara = document.createElement('p');
    weightPara.className = 'dish-weight';
    weightPara.textContent = dish.weight || 'Вес не указан';
    
    const pricePara = document.createElement('p');
    pricePara.className = 'dish-price';
    pricePara.textContent = dish.price + ' ₽';
    
    const descriptionPara = document.createElement('p');
    descriptionPara.className = 'dish-description';
    descriptionPara.textContent = dish.description || '';
    descriptionPara.style.display = 'none';
    
    const addButton = document.createElement('button');
    addButton.className = 'add-btn';
    addButton.textContent = buttonLabel;
    addButton.type = 'button';
    addButton.dataset.category = category;
    addButton.dataset.dishId = dish.id;
    addButton.dataset.name = dish.name;
    addButton.dataset.price = dish.price;
    addButton.dataset.weight = dish.weight || '';
    
    addButton.addEventListener('click', handleAddToCart);
    
    card.appendChild(img);
    card.appendChild(namePara);
    card.appendChild(weightPara);
    card.appendChild(pricePara);
    card.appendChild(descriptionPara);
    card.appendChild(addButton);
    
    return card;
}

// Инициализация формы заказа с API
function initBottomOrderFormWithAPI() {
    const bottomForm = document.getElementById('order-details-form');
    
    if (bottomForm) {
        bottomForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Валидация формы
            if (!validateOrderForm()) {
                return false;
            }
            
            // Проверка API ключа
            if (!window.MosFoodAPI.getApiKey()) {
                showNotification('Для оформления заказа необходим API ключ', 'error');
                return false;
            }
            
            // Проверка лимита заказов
            if (await checkOrderLimit()) {
                showNotification('Превышен лимит заказов (максимум 10)', 'error');
                return false;
            }
            
            // Собираем данные
            const formData = new FormData(this);
            const orderData = collectOrderDataForApi(formData);
            
            try {
                // Показываем индикатор загрузки
                const submitBtn = this.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                submitBtn.textContent = 'Отправка...';
                submitBtn.disabled = true;
                
                // Отправляем заказ через API
                const newOrder = await window.MosFoodAPI.createOrder(orderData);
                
                // Успех
                showNotification('Заказ успешно создан!', 'success');
                
                // Сбрасываем корзину
                resetCart();
                
                // Перенаправляем на страницу заказов
                setTimeout(() => {
                    window.location.href = 'orders.html';
                }, 2000);
                
            } catch (error) {
                console.error('Ошибка создания заказа:', error);
                showNotification('Ошибка создания заказа: ' + error.message, 'error');
                
                // Восстанавливаем кнопку
                const submitBtn = this.querySelector('button[type="submit"]');
                submitBtn.textContent = 'Оформить заказ';
                submitBtn.disabled = false;
            }
        });
    }
}

// Сбор данных заказа для API
function collectOrderDataForApi(formData) {
    const orderData = {
        full_name: formData.get('customer_name') || '',
        email: formData.get('customer_email') || '',
        phone: formData.get('customer_phone') || '',
        delivery_address: formData.get('delivery_address') || '',
        delivery_type: formData.get('delivery_time') === 'asap' ? 'now' : 'by_time',
        comment: formData.get('comments') || '',
        subscribe: formData.get('newsletter') ? 1 : 0
    };
    
    // Время доставки
    if (orderData.delivery_type === 'by_time') {
        const timeValue = formData.get('delivery_time');
        if (timeValue && timeValue !== 'asap') {
            orderData.delivery_time = timeValue.replace(':', '');
        }
    }
    
    // ID блюд из корзины
    // Для этого нужно сопоставить выбранные блюда с ID из API
    // Здесь предполагается, что у нас есть mapping
    const dishMapping = getSelectedDishesMapping();
    
    if (dishMapping.salad) orderData.salad_id = dishMapping.salad;
    if (dishMapping.soup) orderData.soup_id = dishMapping.soup;
    if (dishMapping.main) orderData.main_course_id = dishMapping.main;
    if (dishMapping.drink) orderData.drink_id = dishMapping.drink;
    if (dishMapping.dessert) orderData.dessert_id = dishMapping.dessert;
    
    return orderData;
}

// Проверка лимита заказов
async function checkOrderLimit() {
    try {
        const orders = await window.MosFoodAPI.getAllOrders();
        return orders.length >= 10;
    } catch (error) {
        console.error('Ошибка проверки лимита заказов:', error);
        return false;
    }
}

// Обновленная функция инициализации
document.addEventListener('DOMContentLoaded', function() {
    console.log('MosFood - Страница "Собрать ланч" загружена (API версия)');
    
    // Инициализация API
    if (window.MosFoodAPI) {
        window.MosFoodAPI.init();
    }
    
    // Загрузка блюд из API
    loadDishesFromAPI();
    
    // Остальная инициализация
    initPage();
    
    // Обновленная форма с API
    initBottomOrderFormWithAPI();
});

// Экспорт для глобального использования
window.MosFoodLunch = {
    loadDishesFromAPI,
    initBottomOrderFormWithAPI,
    collectOrderDataForApi
};