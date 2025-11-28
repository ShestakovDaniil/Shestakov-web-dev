// JavaScript для функциональности "Собрать ланч"
let cart = {
    salad: { name: '', price: 0, weight: '' },
    soup: { name: '', price: 0, weight: '' },
    main: { name: '', price: 0, weight: '' },
    drink: { name: '', price: 0, weight: '' }
};

function addToCart(category, value, name, price, weight) {
    // Обновляем данные в корзине
    cart[category] = { name: name, price: price, weight: weight + (category === 'drink' ? ' мл' : ' г') };

    // Обновляем отображение в корзине
    document.getElementById(category + '-preview').textContent = name + ' - ' + price + ' ₽';

    // Обновляем скрытые поля формы
    document.getElementById('selected-' + category).value = value;

    // Пересчитываем общую сумму
    const total = cart.salad.price + cart.soup.price + cart.main.price + cart.drink.price;
    document.getElementById('total-preview').textContent = total + ' ₽';
    document.getElementById('total-price').value = total;

    // Обновляем форму оформления заказа
    updateOrderReview();

    // Проверяем, все ли категории выбраны
    const allSelected = cart.salad.name && cart.soup.name && cart.main.name && cart.drink.name;
    document.querySelector('.order-btn').disabled = !allSelected;

    // Обновляем текст подсказки
    const note = document.querySelector('.form-note');
    if (allSelected) {
        note.innerHTML = '<small>✓ Все блюда выбраны! Можете отправить заказ</small>';
        note.style.color = '#27ae60';
    } else {
        note.innerHTML = '<small>Выберите блюда из всех категорий для активации кнопки</small>';
        note.style.color = '#7f8c8d';
    }

    // Визуальная обратная связь для кнопки
    event.target.textContent = 'Добавлено!';
    event.target.style.backgroundColor = '#27ae60';
    setTimeout(() => {
        event.target.textContent = 'Добавить';
        event.target.style.backgroundColor = '';
    }, 1500);
}

// Функция для обновления формы оформления заказа
function updateOrderReview() {
    document.getElementById('review-salad').textContent = cart.salad.name ? cart.salad.name + ' - ' + cart.salad.price + ' ₽' : 'Не выбран';
    document.getElementById('review-soup').textContent = cart.soup.name ? cart.soup.name + ' - ' + cart.soup.price + ' ₽' : 'Не выбран';
    document.getElementById('review-main').textContent = cart.main.name ? cart.main.name + ' - ' + cart.main.price + ' ₽' : 'Не выбрано';
    document.getElementById('review-drink').textContent = cart.drink.name ? cart.drink.name + ' - ' + cart.drink.price + ' ₽' : 'Не выбран';

    const total = cart.salad.price + cart.soup.price + cart.main.price + cart.drink.price;
    document.getElementById('review-total').textContent = total + ' ₽';
}
// Функция для сортировки карточек по алфавиту
function sortDishesAlphabetically() {
    const categories = document.querySelectorAll('.dishes-category');

    categories.forEach(category => {
        const dishesGrid = category.querySelector('.dishes-grid');
        const dishCards = Array.from(dishesGrid.querySelectorAll('.dish-card'));

        // Сортируем карточки по названию блюда
        dishCards.sort((a, b) => {
            const nameA = a.querySelector('.dish-name').textContent.toLowerCase();
            const nameB = b.querySelector('.dish-name').textContent.toLowerCase();
            return nameA.localeCompare(nameB);
        });

        // Очищаем и добавляем отсортированные карточки
        dishesGrid.innerHTML = '';
        dishCards.forEach(card => {
            dishesGrid.appendChild(card);
        });
    });
}

// Сортируем при загрузке страницы
document.addEventListener('DOMContentLoaded', function () {
    sortDishesAlphabetically();
});
// Переменные для хранения текущих фильтров
let currentCategory = 'all';
let currentTag = 'all';

// Функция фильтрации по категориям
function filterDishes(category) {
    currentCategory = category;

    // Убираем активный класс со всех кнопок категорий
    document.querySelectorAll('.filter-group:first-child .filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Добавляем активный класс нажатой кнопке
    event.target.classList.add('active');

    // Применяем оба фильтра
    applyBothFilters();
}

// Функция фильтрации по тегам
function filterByTag(tag) {
    currentTag = tag;

    // Убираем активный класс со всех кнопок тегов
    document.querySelectorAll('.filter-group:nth-child(2) .filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Добавляем активный класс нажатой кнопке
    event.target.classList.add('active');

    // Применяем оба фильтра
    applyBothFilters();
}

// Главная функция, которая применяет ОБА фильтра одновременно
function applyBothFilters() {
    const allCards = document.querySelectorAll('.dish-card');

    allCards.forEach(card => {
        const cardCategory = card.dataset.category;
        const cardTags = card.dataset.tags ? card.dataset.tags.split(' ') : [];

        // Проверяем оба условия:
        // 1. Подходит ли по категории
        // 2. Подходит ли по тегу
        const categoryMatch = currentCategory === 'all' || cardCategory === currentCategory;
        const tagMatch = currentTag === 'all' || cardTags.includes(currentTag);

        // Показываем карточку только если она подходит по ОБОИМ фильтрам
        if (categoryMatch && tagMatch) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });
}

// Функция сброса всех фильтров
function resetFilters() {
    currentCategory = 'all';
    currentTag = 'all';

    // Сбрасываем кнопки
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Активируем кнопки "Все"
    document.querySelectorAll('.filter-group .filter-btn:first-child').forEach(btn => {
        btn.classList.add('active');
    });

    // Показываем все карточки
    document.querySelectorAll('.dish-card').forEach(card => {
        card.classList.remove('hidden');
    });
}