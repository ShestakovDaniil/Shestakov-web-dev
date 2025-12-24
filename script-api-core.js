// MosFood API Core - централизованная работа с API
// Версия 1.0

const MosFoodAPI = (function() {
    const API_BASE_URL = 'https://edu.std-900.ist.mospolytech.ru';
    let apiKey = localStorage.getItem('mosfood_api_key');
    let currentStudentId = null;

    // Инициализация API
    function init() {
        console.log('MosFood API инициализирован');
        
        // Проверяем наличие API ключа
        if (!apiKey) {
            console.warn('API ключ не найден в localStorage');
            showGlobalNotification('Для работы с заказами необходим API ключ', 'warning');
        } else {
            console.log('API ключ найден:', apiKey.substring(0, 8) + '...');
        }
        
        // Загружаем ID студента из ключа (если есть)
        loadStudentId();
    }

    // Загрузка ID студента
    function loadStudentId() {
        if (apiKey) {
            // В реальном API должен быть endpoint для получения информации о пользователе
            // Здесь используем localStorage
            currentStudentId = localStorage.getItem('mosfood_student_id') || '1001';
        }
    }

    // Установка API ключа
    function setApiKey(key) {
        if (!key || key.trim() === '') {
            console.error('Пустой API ключ');
            return false;
        }
        
        // Проверяем формат UUIDv4
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(key)) {
            console.error('Неверный формат API ключа. Ожидается UUIDv4');
            showGlobalNotification('Неверный формат API ключа', 'error');
            return false;
        }
        
        apiKey = key.trim();
        localStorage.setItem('mosfood_api_key', apiKey);
        
        // Генерируем студенческий ID на основе ключа
        currentStudentId = parseInt(key.replace(/[^0-9]/g, '').substring(0, 4)) || 1001;
        localStorage.setItem('mosfood_student_id', currentStudentId);
        
        console.log('API ключ установлен:', apiKey.substring(0, 8) + '...');
        console.log('Student ID установлен:', currentStudentId);
        
        return true;
    }

    // Получение API ключа
    function getApiKey() {
        return apiKey;
    }

    // Получение Student ID
    function getStudentId() {
        return currentStudentId;
    }

    // Базовый запрос к API
    async function apiRequest(endpoint, method = 'GET', data = null) {
        const url = `${API_BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${apiKey}`;
        
        const options = {
            method: method,
            headers: {
                'Accept': 'application/json',
            },
            credentials: 'omit'
        };

        // Добавляем тело запроса для POST/PUT
        if (data && (method === 'POST' || method === 'PUT')) {
            if (data instanceof FormData) {
                options.body = data;
                // FormData автоматически устанавливает Content-Type
            } else {
                options.headers['Content-Type'] = 'application/json';
                options.body = JSON.stringify(data);
            }
        }

        try {
            console.log(`API запрос: ${method} ${endpoint}`);
            
            const response = await fetch(url, options);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            // Для DELETE запросов может не быть тела
            if (method === 'DELETE' && response.status === 204) {
                return { success: true };
            }
            
            const result = await response.json();
            return result;
            
        } catch (error) {
            console.error('Ошибка API запроса:', error);
            
            // Обработка ошибки авторизации
            if (error.message.includes('401') || error.message.includes('authorization')) {
                handleAuthError();
            }
            
            throw error;
        }
    }

    // Обработка ошибки авторизации
    function handleAuthError() {
        console.error('Ошибка авторизации API');
        localStorage.removeItem('mosfood_api_key');
        localStorage.removeItem('mosfood_student_id');
        apiKey = null;
        currentStudentId = null;
        
        showGlobalNotification('Ошибка авторизации. Пожалуйста, обновите API ключ', 'error');
    }

    // Получить все блюда
    async function getAllDishes() {
        try {
            const dishes = await apiRequest('/api/dishes', 'GET');
            console.log(`Получено блюд: ${dishes.length}`);
            return dishes;
        } catch (error) {
            console.error('Ошибка получения блюд:', error);
            throw error;
        }
    }

    // Получить конкретное блюдо
    async function getDishById(dishId) {
        try {
            const dish = await apiRequest(`/api/dishes/${dishId}`, 'GET');
            return dish;
        } catch (error) {
            console.error(`Ошибка получения блюда ${dishId}:`, error);
            throw error;
        }
    }

    // Получить все заказы пользователя
    async function getAllOrders() {
        try {
            const orders = await apiRequest('/api/orders', 'GET');
            console.log(`Получено заказов: ${orders.length}`);
            return orders;
        } catch (error) {
            console.error('Ошибка получения заказов:', error);
            throw error;
        }
    }

    // Получить конкретный заказ
    async function getOrderById(orderId) {
        try {
            const order = await apiRequest(`/api/orders/${orderId}`, 'GET');
            return order;
        } catch (error) {
            console.error(`Ошибка получения заказа ${orderId}:`, error);
            throw error;
        }
    }

    // Создать новый заказ
    async function createOrder(orderData) {
        try {
            // Преобразуем данные в формат API
            const apiOrderData = transformToApiFormat(orderData);
            
            const newOrder = await apiRequest('/api/orders', 'POST', apiOrderData);
            console.log('Заказ создан:', newOrder);
            
            // Диспетчеризация события
            document.dispatchEvent(new CustomEvent('orderCreated', {
                detail: { order: newOrder }
            }));
            
            return newOrder;
        } catch (error) {
            console.error('Ошибка создания заказа:', error);
            throw error;
        }
    }

    // Обновить заказ
    async function updateOrder(orderId, orderData) {
        try {
            const apiOrderData = transformToApiFormat(orderData);
            const updatedOrder = await apiRequest(`/api/orders/${orderId}`, 'PUT', apiOrderData);
            console.log('Заказ обновлен:', updatedOrder);
            
            document.dispatchEvent(new CustomEvent('orderUpdated', {
                detail: { orderId, order: updatedOrder }
            }));
            
            return updatedOrder;
        } catch (error) {
            console.error(`Ошибка обновления заказа ${orderId}:`, error);
            throw error;
        }
    }

    // Удалить заказ
    async function deleteOrder(orderId) {
        try {
            const result = await apiRequest(`/api/orders/${orderId}`, 'DELETE');
            console.log('Заказ удален:', orderId);
            
            document.dispatchEvent(new CustomEvent('orderDeleted', {
                detail: { orderId }
            }));
            
            return result;
        } catch (error) {
            console.error(`Ошибка удаления заказа ${orderId}:`, error);
            throw error;
        }
    }

    // Преобразование данных в формат API
    function transformToApiFormat(formData) {
        const apiData = {
            full_name: formData.full_name || formData.customer_name || '',
            email: formData.email || formData.customer_email || '',
            phone: formData.phone || formData.customer_phone || '',
            delivery_address: formData.delivery_address || '',
            delivery_type: formData.delivery_type || 'now',
            comment: formData.comment || formData.comments || '',
            salad_id: parseInt(formData.salad_id) || null,
            soup_id: parseInt(formData.soup_id) || null,
            main_course_id: parseInt(formData.main_course_id) || null,
            drink_id: parseInt(formData.drink_id) || null,
            dessert_id: parseInt(formData.dessert_id) || null,
            subscribe: formData.subscribe ? 1 : 0
        };

        // Обработка времени доставки
        if (apiData.delivery_type === 'by_time' && formData.delivery_time) {
            let timeStr = formData.delivery_time;
            
            // Преобразуем "HH:MM" в "HHMM"
            if (timeStr.includes(':')) {
                timeStr = timeStr.replace(':', '');
            }
            
            // Убедимся, что время в правильном формате
            if (/^\d{4}$/.test(timeStr)) {
                apiData.delivery_time = timeStr;
            }
        }

        return apiData;
    }

    // Преобразование данных из формата API
    function transformFromApiFormat(apiOrder) {
        return {
            id: apiOrder.id,
            number: apiOrder.id,
            full_name: apiOrder.full_name,
            email: apiOrder.email,
            phone: apiOrder.phone,
            delivery_address: apiOrder.delivery_address,
            delivery_type: apiOrder.delivery_type,
            delivery_time: apiOrder.delivery_time,
            comment: apiOrder.comment,
            salad_id: apiOrder.salad_id,
            soup_id: apiOrder.soup_id,
            main_course_id: apiOrder.main_course_id,
            drink_id: apiOrder.drink_id,
            dessert_id: apiOrder.dessert_id,
            subscribe: apiOrder.subscribe,
            created_at: apiOrder.created_at,
            updated_at: apiOrder.updated_at,
            student_id: apiOrder.student_id,
            
            // Дополнительные поля для совместимости
            date: apiOrder.created_at,
            deliveryTime: formatDeliveryTime(apiOrder.delivery_time, apiOrder.delivery_type),
            status: getOrderStatus(apiOrder),
            statusLabel: getOrderStatusLabel(getOrderStatus(apiOrder)),
            contacts: apiOrder.phone,
            comments: apiOrder.comment,
            paymentMethod: 'Картой онлайн'
        };
    }

    // Вспомогательные функции
    function formatDeliveryTime(deliveryTime, deliveryType) {
        if (deliveryType === 'now') {
            return 'Как можно скорее';
        }
        
        if (deliveryTime && deliveryTime.length === 4) {
            return `${deliveryTime.substring(0, 2)}:${deliveryTime.substring(2, 4)}`;
        }
        
        return 'Как можно скорее';
    }

    function getOrderStatus(apiOrder) {
        // В реальном API должен быть статус заказа
        // Здесь определяем статус на основе времени создания
        const created = new Date(apiOrder.created_at);
        const now = new Date();
        const diffHours = (now - created) / (1000 * 60 * 60);
        
        if (diffHours < 0.5) return 'pending';
        if (diffHours < 1) return 'processing';
        if (diffHours < 2) return 'delivering';
        return 'delivered';
    }

    function getOrderStatusLabel(status) {
        const labels = {
            'pending': 'Ожидает подтверждения',
            'processing': 'Готовится',
            'delivering': 'Доставляется',
            'delivered': 'Доставлен',
            'cancelled': 'Отменен'
        };
        return labels[status] || 'Неизвестно';
    }

    // Глобальное уведомление
    function showGlobalNotification(message, type = 'info') {
        // Диспетчеризация события для отображения уведомления
        document.dispatchEvent(new CustomEvent('showNotification', {
            detail: { message, type }
        }));
    }

    // Экспорт публичных методов
    return {
        init,
        setApiKey,
        getApiKey,
        getStudentId,
        getAllDishes,
        getDishById,
        getAllOrders,
        getOrderById,
        createOrder,
        updateOrder,
        deleteOrder,
        transformToApiFormat,
        transformFromApiFormat,
        formatDeliveryTime
    };
})();

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    MosFoodAPI.init();
});

// Экспорт для глобального использования
window.MosFoodAPI = MosFoodAPI;