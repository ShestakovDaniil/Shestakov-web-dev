// JavaScript для страницы "Мои заказы" MosFood
// Полная интеграция с API

let orders = [];
let currentPage = 1;
let ordersPerPage = 10;
let currentFilter = 'all';
let currentTimeFilter = 'all';
let currentSearch = '';

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async function() {
    console.log('MosFood - Страница "Мои заказы" загружена');
    
    // Проверяем API ключ
    if (!window.MosFoodAPI || !window.MosFoodAPI.getApiKey()) {
        showNotification('Для просмотра заказов необходим API ключ', 'warning');
        showApiKeyPrompt();
        return;
    }
    
    // Загрузка заказов
    await loadOrdersFromAPI();
    
    // Инициализация элементов управления
    initControls();
    
    // Инициализация модальных окон
    initModals();
});

// Загрузка заказов из API
async function loadOrdersFromAPI() {
    console.log('Загрузка заказов с API...');
    
    try {
        const apiOrders = await window.MosFoodAPI.getAllOrders();
        
        if (!apiOrders || apiOrders.length === 0) {
            showNoOrdersMessage();
            return;
        }
        
        // Преобразуем данные API в наш формат
        orders = apiOrders.map(apiOrder => {
            const transformed = window.MosFoodAPI.transformFromApiFormat(apiOrder);
            
            // Добавляем блюда
            const dishes = [];
            if (apiOrder.salad_name) dishes.push(apiOrder.salad_name);
            if (apiOrder.soup_name) dishes.push(apiOrder.soup_name);
            if (apiOrder.main_course_name) dishes.push(apiOrder.main_course_name);
            if (apiOrder.drink_name) dishes.push(apiOrder.drink_name);
            if (apiOrder.dessert_name) dishes.push(apiOrder.dessert_name);
            
            transformed.dishes = dishes;
            transformed.total = calculateOrderTotal(apiOrder);
            transformed.subtotal = transformed.total - 50;
            transformed.deliveryFee = 50;
            
            return transformed;
        });
        
        // Сортируем по дате
        orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // Отображаем заказы
        displayOrders();
        
        // Обновляем статистику
        updateStatistics();
        
        console.log(`Загружено ${orders.length} заказов`);
        showNotification(`Загружено ${orders.length} заказов`, 'success');
        
    } catch (error) {
        console.error('Ошибка загрузки заказов:', error);
        
        if (error.message.includes('401') || error.message.includes('authorization')) {
            showNotification('Ошибка авторизации. Проверьте API ключ', 'error');
            showApiKeyPrompt();
        } else {
            showNotification('Ошибка загрузки заказов', 'error');
            loadSampleOrders();
        }
    }
}

// Расчет суммы заказа
function calculateOrderTotal(apiOrder) {
    let total = 0;
    
    // В реальном API должна быть сумма, здесь приблизительный расчет
    if (apiOrder.salad_price) total += parseInt(apiOrder.salad_price);
    if (apiOrder.soup_price) total += parseInt(apiOrder.soup_price);
    if (apiOrder.main_course_price) total += parseInt(apiOrder.main_course_price);
    if (apiOrder.drink_price) total += parseInt(apiOrder.drink_price);
    if (apiOrder.dessert_price) total += parseInt(apiOrder.dessert_price);
    
    // Если нет цен в API, используем примерные
    if (total === 0) {
        total = 350 + Math.floor(Math.random() * 300);
    }
    
    return total;
}

// Отображение заказа в модальном окне с данными API
function showOrderDetailsFromAPI(order) {
    // Заполняем модальное окно
    document.getElementById('modal-order-number').textContent = `#${order.id}`;
    document.getElementById('detail-order-id').textContent = order.id;
    
    const orderDate = new Date(order.created_at);
    document.getElementById('detail-order-date').textContent = 
        orderDate.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    
    document.getElementById('detail-order-status').textContent = order.statusLabel;
    document.getElementById('detail-order-status').className = `detail-value status-badge status-${order.status}`;
    
    document.getElementById('detail-payment-method').textContent = order.paymentMethod;
    document.getElementById('detail-delivery-address').textContent = order.delivery_address;
    document.getElementById('detail-delivery-time').textContent = window.MosFoodAPI.formatDeliveryTime(order.delivery_time, order.delivery_type);
    document.getElementById('detail-contacts').textContent = order.phone;
    document.getElementById('detail-email').textContent = order.email;
    document.getElementById('detail-subtotal').textContent = `${order.subtotal} ₽`;
    document.getElementById('detail-delivery-fee').textContent = `${order.deliveryFee} ₽`;
    document.getElementById('detail-total').textContent = `${order.total} ₽`;
    
    // Состав заказа
    const orderItemsList = document.getElementById('detail-order-items');
    orderItemsList.innerHTML = '';
    
    order.dishes.forEach(dish => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'order-item-detail';
        itemDiv.innerHTML = `
            <span>${dish}</span>
            <span>${getDishPrice(dish)}</span>
        `;
        orderItemsList.appendChild(itemDiv);
    });
    
    // Комментарий
    const commentElement = document.getElementById('detail-order-comment');
    const commentsContainer = document.getElementById('detail-comments-container');
    
    if (order.comment) {
        commentElement.textContent = order.comment;
        commentsContainer.style.display = 'block';
    } else {
        commentsContainer.style.display = 'none';
    }
    
    // Показываем модальное окно
    document.getElementById('order-details-modal').classList.add('active');
}

// Редактирование заказа через API
async function editOrderWithAPI(orderId) {
    const order = orders.find(o => o.id == orderId);
    
    if (!order) {
        showNotification('Заказ не найден', 'error');
        return;
    }
    
    // Заполняем форму
    document.getElementById('edit-order-number').textContent = `#${order.id}`;
    document.getElementById('edit-order-id').value = order.id;
    
    // Время доставки
    if (order.delivery_type === 'now') {
        document.getElementById('edit-delivery-time').value = 'asap';
    } else {
        const timeStr = order.delivery_time;
        if (timeStr && timeStr.length === 4) {
            document.getElementById('edit-delivery-time').value = 
                `${timeStr.substring(0, 2)}:${timeStr.substring(2, 4)}`;
        }
    }
    
    document.getElementById('edit-delivery-address').value = order.delivery_address;
    document.getElementById('edit-contacts').value = order.phone;
    document.getElementById('edit-email').value = order.email;
    document.getElementById('edit-comments').value = order.comment;
    
    // Показываем модальное окно
    document.getElementById('edit-order-modal').classList.add('active');
}

// Сохранение изменений через API
async function saveOrderChangesWithAPI() {
    const orderId = document.getElementById('edit-order-id').value;
    const order = orders.find(o => o.id == orderId);
    
    if (!order) {
        showNotification('Заказ не найден', 'error');
        return;
    }
    
    // Собираем данные
    const deliveryTime = document.getElementById('edit-delivery-time').value;
    const deliveryAddress = document.getElementById('edit-delivery-address').value.trim();
    const contacts = document.getElementById('edit-contacts').value.trim();
    const email = document.getElementById('edit-email').value.trim();
    const comments = document.getElementById('edit-comments').value.trim();
    const agreement = document.getElementById('edit-agreement').checked;
    
    // Валидация
    if (!deliveryAddress || !contacts || !email || !agreement) {
        showNotification('Заполните все обязательные поля', 'error');
        return;
    }
    
    // Подготавливаем данные для API
    const updateData = {
        full_name: order.full_name, // Имя не меняем
        email: email,
        phone: contacts,
        delivery_address: deliveryAddress,
        comment: comments,
        delivery_type: deliveryTime === 'asap' ? 'now' : 'by_time'
    };
    
    // Время доставки
    if (updateData.delivery_type === 'by_time' && deliveryTime !== 'asap') {
        updateData.delivery_time = deliveryTime.replace(':', '');
    }
    
    try {
        // Показываем индикатор загрузки
        const saveBtn = document.getElementById('save-order-btn');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Сохранение...';
        saveBtn.disabled = true;
        
        // Отправляем запрос
        const updatedOrder = await window.MosFoodAPI.updateOrder(orderId, updateData);
        
        // Обновляем локальные данные
        const index = orders.findIndex(o => o.id == orderId);
        if (index !== -1) {
            orders[index] = window.MosFoodAPI.transformFromApiFormat(updatedOrder);
            orders[index].dishes = order.dishes;
            orders[index].total = order.total;
            orders[index].subtotal = order.subtotal;
            orders[index].deliveryFee = order.deliveryFee;
        }
        
        // Закрываем модальное окно
        document.getElementById('edit-order-modal').classList.remove('active');
        
        // Обновляем отображение
        displayOrders();
        
        // Показываем уведомление
        showNotification('Заказ успешно обновлен', 'success');
        
        // Сбрасываем форму
        document.getElementById('edit-order-form').reset();
        
    } catch (error) {
        console.error('Ошибка обновления заказа:', error);
        showNotification('Ошибка обновления заказа: ' + error.message, 'error');
        
        // Восстанавливаем кнопку
        const saveBtn = document.getElementById('save-order-btn');
        saveBtn.textContent = 'Сохранить изменения';
        saveBtn.disabled = false;
    }
}

// Удаление заказа через API
async function deleteOrderWithAPI() {
    const orderId = this.dataset.orderId;
    const order = orders.find(o => o.id == orderId);
    
    if (!order) {
        showNotification('Заказ не найден', 'error');
        return;
    }
    
    try {
        // Показываем индикатор загрузки
        const deleteBtn = document.getElementById('confirm-delete-btn');
        const originalText = deleteBtn.textContent;
        deleteBtn.textContent = 'Удаление...';
        deleteBtn.disabled = true;
        
        // Отправляем запрос
        await window.MosFoodAPI.deleteOrder(orderId);
        
        // Удаляем из локального массива
        const index = orders.findIndex(o => o.id == orderId);
        if (index !== -1) {
            orders.splice(index, 1);
        }
        
        // Закрываем модальное окно
        document.getElementById('delete-confirm-modal').classList.remove('active');
        
        // Обновляем отображение
        displayOrders();
        updateStatistics();
        
        // Показываем уведомление
        showNotification('Заказ успешно удален', 'success');
        
    } catch (error) {
        console.error('Ошибка удаления заказа:', error);
        showNotification('Ошибка удаления заказа: ' + error.message, 'error');
        
        // Восстанавливаем кнопку
        const deleteBtn = document.getElementById('confirm-delete-btn');
        deleteBtn.textContent = 'Да, удалить';
        deleteBtn.disabled = false;
    }
}

// Запрос API ключа
function showApiKeyPrompt() {
    const promptHtml = `
        <div class="api-key-prompt-overlay">
            <div class="api-key-prompt">
                <h3>Требуется API ключ</h3>
                <p>Для работы с заказами необходим API ключ. Получите его по ссылке в СДО Московского Политеха.</p>
                <div class="api-key-input-group">
                    <input type="text" id="api-key-input" placeholder="Введите ваш API ключ (UUIDv4)" />
                    <button id="save-api-key-btn">Сохранить</button>
                </div>
                <button id="close-api-key-prompt">Продолжить без API</button>
            </div>
        </div>
    `;
    
    const promptDiv = document.createElement('div');
    promptDiv.innerHTML = promptHtml;
    document.body.appendChild(promptDiv.firstElementChild);
    
    // Обработчики
    document.getElementById('save-api-key-btn').addEventListener('click', function() {
        const apiKey = document.getElementById('api-key-input').value.trim();
        
        if (apiKey && window.MosFoodAPI.setApiKey(apiKey)) {
            // Перезагружаем заказы
            loadOrders