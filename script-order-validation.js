
// Скрипт валидации заказа для MosFood - бизнес-ланчи
// Версия с уведомлениями согласно требованиям

document.addEventListener('DOMContentLoaded', function () {
    console.log('Скрипт валидации заказа MosFood загружен');

    // Инициализация валидации формы
    initOrderValidation();
});

// Основная функция инициализации валидации
function initOrderValidation() {
    const orderForm = document.querySelector('.order-details-form');

    if (orderForm) {
        console.log('Форма заказа найдена, добавляем валидацию...');

        // Удаляем старый обработчик, если есть
        orderForm.removeEventListener('submit', validateOrderOnSubmit);

        // Добавляем обработчик отправки формы
        orderForm.addEventListener('submit', validateOrderOnSubmit, false);

        console.log('Валидация заказа активирована');
    } else {
        console.warn('Форма заказа не найдена, повторная попытка через 500мс...');
        // Повторная попытка через 500мс
        setTimeout(initOrderValidation, 500);
    }
}

// Получение текущего состояния корзины
function getCartState() {
    // Проверяем наличие объекта корзины в разных местах
    if (window.MosFoodLunch && window.MosFoodLunch.cart) {
        return window.MosFoodLunch.cart;
    } else if (window.cart) {
        return window.cart;
    } else {
        // Если глобальный объект не найден, собираем данные из DOM
        return collectCartStateFromDOM();
    }
}

// Сбор данных корзины из DOM
function collectCartStateFromDOM() {
    const cartState = {
        salad: { name: '', price: 0, weight: '' },
        soup: { name: '', price: 0, weight: '' },
        main: { name: '', price: 0, weight: '' },
        drink: { name: '', price: 0, weight: '' },
        dessert: { name: '', price: 0, weight: '' }
    };

    // Проверяем превью в корзине
    const saladPreview = document.getElementById('salad-preview');
    const soupPreview = document.getElementById('soup-preview');
    const mainPreview = document.getElementById('main-preview');
    const drinkPreview = document.getElementById('drink-preview');
    const dessertPreview = document.getElementById('dessert-preview');

    if (saladPreview && saladPreview.textContent !== 'Не выбран') {
        cartState.salad.name = extractDishName(saladPreview.textContent);
    }

    if (soupPreview && soupPreview.textContent !== 'Не выбран') {
        cartState.soup.name = extractDishName(soupPreview.textContent);
    }

    if (mainPreview && mainPreview.textContent !== 'Не выбрано') {
        cartState.main.name = extractDishName(mainPreview.textContent);
    }

    if (drinkPreview && drinkPreview.textContent !== 'Не выбран') {
        cartState.drink.name = extractDishName(drinkPreview.textContent);
    }

    if (dessertPreview && dessertPreview.textContent !== 'Не выбран') {
        cartState.dessert.name = extractDishName(dessertPreview.textContent);
    }

    return cartState;
}

// Извлечение названия блюда из строки (убираем цену)
function extractDishName(fullText) {
    if (!fullText || fullText === 'Не выбран' || fullText === 'Не выбрано') {
        return '';
    }

    // Убираем часть с ценой (формат "Название - 100 ₽")
    const parts = fullText.split(' - ');
    return parts[0].trim();
}

// Основная функция валидации при отправке формы
function validateOrderOnSubmit(event) {
    event.preventDefault();
    event.stopPropagation();

    console.log('Запуск валидации заказа...');

    // Получаем текущее состояние корзины
    const cart = getCartState();
    console.log('Состояние корзины:', cart);

    // Проверяем наличие блюд по категориям
    const hasSalad = cart.salad && cart.salad.name && cart.salad.name.trim() !== '';
    const hasSoup = cart.soup && cart.soup.name && cart.soup.name.trim() !== '';
    const hasMain = cart.main && cart.main.name && cart.main.name.trim() !== '';
    const hasDrink = cart.drink && cart.drink.name && cart.drink.name.trim() !== '';
    const hasDessert = cart.dessert && cart.dessert.name && cart.dessert.name.trim() !== '';

    console.log('Наличие блюд:', { hasSalad, hasSoup, hasMain, hasDrink, hasDessert });

    // Проверка 1: Ничего не выбрано
    if (!hasSalad && !hasSoup && !hasMain && !hasDrink && !hasDessert) {
        console.log('Ничего не выбрано');
        showNotification('Ничего не выбрано. Выберите блюда для заказа');
        return false;
    }

    // Проверка 2: Выбран только напиток или десерт
    if ((hasDrink || hasDessert) && !hasSalad && !hasSoup && !hasMain) {
        console.log('Выбран только напиток или десерт, без основного');
        showNotification('Выберите главное блюдо');
        return false;
    }

    // Проверка 3: Выбран салат, но нет супа или основного
    if (hasSalad && !hasSoup && !hasMain) {
        console.log('Выбран салат, но нет супа или основного');
        showNotification('Выберите суп или главное блюдо');
        return false;
    }

    // Проверка 4: Выбран суп, но нет основного или салата
    if (hasSoup && !hasMain && !hasSalad) {
        console.log('Выбран суп, но нет основного или салата');
        showNotification('Выберите главное блюдо/салат/стартер');
        return false;
    }

    // Проверка 5: Выбраны все, кроме напитка
    if ((hasSalad || hasSoup || hasMain) && !hasDrink) {
        console.log('Выбраны основные блюда, но нет напитка');
        showNotification('Выберите напиток');
        return false;
    }

    // Проверка 6: Все основные блюда есть, напиток есть
    // Это валидная комбинация - разрешаем отправку
    if ((hasSalad || hasSoup || hasMain) && hasDrink) {
        console.log('Валидная комбинация блюд, разрешаем отправку');

        // Показываем уведомление об успехе
        showSuccessNotification();

        // Отправляем форму через 1.5 секунды (после показа уведомления)
        setTimeout(() => {
            const orderForm = document.querySelector('.order-details-form');
            if (orderForm) {
                // Создаем новый событие submit для отправки формы
                const submitEvent = new Event('submit', {
                    cancelable: true,
                    bubbles: true
                });

                // Удаляем наш обработчик, чтобы не было рекурсии
                orderForm.removeEventListener('submit', validateOrderOnSubmit);

                // Отправляем форму
                orderForm.dispatchEvent(submitEvent);

                // Если форма не отправилась программно, отправляем стандартным способом
                if (!submitEvent.defaultPrevented) {
                    orderForm.submit();
                }

                // Возвращаем обработчик
                setTimeout(() => {
                    orderForm.addEventListener('submit', validateOrderOnSubmit, false);
                }, 1000);
            }
        }, 1500);

        return true;
    }

    // Если мы дошли сюда, значит какая-то непредвиденная комбинация
    console.log('Неизвестная комбинация блюд');
    showNotification('Пожалуйста, выберите правильную комбинацию блюд');
    return false;
}

// Функция показа уведомления
function showNotification(message) {
    console.log('Показ уведомления:', message);

    // Удаляем старое уведомление, если есть
    const oldNotification = document.querySelector('.mosfood-validation-notification');
    if (oldNotification) {
        oldNotification.remove();
    }

    // Создаем уведомление
    const notification = document.createElement('div');
    notification.className = 'mosfood-validation-notification';
    notification.style.position = 'fixed';
    notification.style.top = '50%';
    notification.style.left = '50%';
    notification.style.transform = 'translate(-50%, -50%)';
    notification.style.backgroundColor = 'white';
    notification.style.padding = '30px';
    notification.style.borderRadius = '15px';
    notification.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
    notification.style.zIndex = '10000';
    notification.style.maxWidth = '400px';
    notification.style.width = '90%';
    notification.style.textAlign = 'center';
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s ease';

    // Добавляем текст
    const messageText = document.createElement('div');
    messageText.textContent = message;
    messageText.style.fontSize = '18px';
    messageText.style.marginBottom = '25px';
    messageText.style.color = '#2c3e50';
    messageText.style.lineHeight = '1.4';
    messageText.style.fontWeight = '600';

    // Добавляем кнопку "Окей"
    const okButton = document.createElement('button');
    okButton.textContent = 'Окей';
    okButton.style.backgroundColor = '#3498db';
    okButton.style.color = 'white';
    okButton.style.border = 'none';
    okButton.style.padding = '12px 40px';
    okButton.style.borderRadius = '25px';
    okButton.style.fontSize = '16px';
    okButton.style.fontWeight = '600';
    okButton.style.cursor = 'pointer';
    okButton.style.transition = 'all 0.3s ease';

    // Эффекты при наведении на кнопку
    okButton.addEventListener('mouseenter', function () {
        this.style.backgroundColor = '#2980b9';
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 5px 15px rgba(52, 152, 219, 0.3)';
    });

    okButton.addEventListener('mouseleave', function () {
        this.style.backgroundColor = '#3498db';
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = 'none';
    });

    // Закрытие уведомления по клику
    okButton.addEventListener('click', function () {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    });

    // Собираем уведомление
    notification.appendChild(messageText);
    notification.appendChild(okButton);
    document.body.appendChild(notification);

    // Анимация появления
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);

    // Автоматическое закрытие через 8 секунд
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 8000);

    // Закрытие при клике на оверлей
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.zIndex = '9999';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s ease';

    overlay.addEventListener('click', function () {
        notification.style.opacity = '0';
        this.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) notification.remove();
            if (this.parentNode) this.remove();
        }, 300);
    });

    document.body.appendChild(overlay);

    // Анимация оверлея
    setTimeout(() => {
        overlay.style.opacity = '1';
    }, 10);
}

// Функция показа уведомления об успехе
function showSuccessNotification() {
    console.log('Показ уведомления об успехе');

    // Удаляем старое уведомление, если есть
    const oldNotification = document.querySelector('.mosfood-success-notification');
    if (oldNotification) {
        oldNotification.remove();
    }

    // Создаем уведомление об успехе
    const notification = document.createElement('div');
    notification.className = 'mosfood-success-notification';
    notification.style.position = 'fixed';
    notification.style.top = '50%';
    notification.style.left = '50%';
    notification.style.transform = 'translate(-50%, -50%)';
    notification.style.backgroundColor = 'white';
    notification.style.padding = '40px 30px';
    notification.style.borderRadius = '15px';
    notification.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
    notification.style.zIndex = '10000';
    notification.style.maxWidth = '400px';
    notification.style.width = '90%';
    notification.style.textAlign = 'center';
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s ease';

    // Добавляем иконку успеха
    const icon = document.createElement('div');
    icon.textContent = '✅';
    icon.style.fontSize = '60px';
    icon.style.marginBottom = '20px';

    // Добавляем текст
    const messageText = document.createElement('div');
    messageText.textContent = 'Заказ оформлен!';
    messageText.style.fontSize = '22px';
    messageText.style.marginBottom = '15px';
    messageText.style.color = '#27ae60';
    messageText.style.fontWeight = '700';

    // Добавляем подтекст
    const subText = document.createElement('div');
    subText.textContent = 'Ваш заказ успешно отправлен на обработку';
    subText.style.fontSize = '16px';
    subText.style.color = '#7f8c8d';
    subText.style.marginBottom = '25px';
    subText.style.lineHeight = '1.4';

    // Добавляем спиннер загрузки
    const spinner = document.createElement('div');
    spinner.style.display = 'inline-block';
    spinner.style.width = '40px';
    spinner.style.height = '40px';
    spinner.style.border = '4px solid #f3f3f3';
    spinner.style.borderTop = '4px solid #3498db';
    spinner.style.borderRadius = '50%';
    spinner.style.animation = 'spin 1s linear infinite';
    spinner.style.marginTop = '10px';

    // Стили для анимации спиннера
    const spinAnimation = document.createElement('style');
    spinAnimation.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(spinAnimation);

    // Собираем уведомление
    notification.appendChild(icon);
    notification.appendChild(messageText);
    notification.appendChild(subText);
    notification.appendChild(spinner);
    document.body.appendChild(notification);

    // Анимация появления
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);

    // Автоматическое закрытие через 3 секунды
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 3000);

    // Оверлей для фона
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.zIndex = '9999';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s ease';

    document.body.appendChild(overlay);

    // Анимация оверлея
    setTimeout(() => {
        overlay.style.opacity = '1';
    }, 10);

    // Автоматическое закрытие оверлея
    setTimeout(() => {
        if (overlay.parentNode) {
            overlay.style.opacity = '0';
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.remove();
                }
            }, 300);
        }
    }, 3000);
}

// Вспомогательная функция для проверки состояния заказа (для отладки)
function checkOrderStatus() {
    const cart = getCartState();

    const hasSalad = cart.salad && cart.salad.name && cart.salad.name.trim() !== '';
    const hasSoup = cart.soup && cart.soup.name && cart.soup.name.trim() !== '';
    const hasMain = cart.main && cart.main.name && cart.main.name.trim() !== '';
    const hasDrink = cart.drink && cart.drink.name && cart.drink.name.trim() !== '';
    const hasDessert = cart.dessert && cart.dessert.name && cart.dessert.name.trim() !== '';

    console.log('=== ТЕКУЩИЙ СТАТУС ЗАКАЗА ===');
    console.log('Салат:', hasSalad ? cart.salad.name : 'Не выбран');
    console.log('Суп:', hasSoup ? cart.soup.name : 'Не выбран');
    console.log('Основное блюдо:', hasMain ? cart.main.name : 'Не выбрано');
    console.log('Напиток:', hasDrink ? cart.drink.name : 'Не выбран');
    console.log('Десерт:', hasDessert ? cart.dessert.name : 'Не выбран');
    console.log('============================');

    return {
        hasSalad,
        hasSoup,
        hasMain,
        hasDrink,
        hasDessert,
        cart
    };
}

// Экспортируем функции для глобального использования
window.MosFoodOrderValidator = {
    validateOrder: validateOrderOnSubmit,
    checkOrderStatus: checkOrderStatus,
    showNotification: showNotification,
    showSuccessNotification: showSuccessNotification
};

console.log('MosFoodOrderValidator инициализирован и готов к работе');