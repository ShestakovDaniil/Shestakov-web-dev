// JavaScript для главной страницы MosFood

document.addEventListener('DOMContentLoaded', function () {
    console.log('MosFood - Главная страница загружена');

    // Проверка поддержки современных функций
    if (!('querySelector' in document)) {
        alert('Ваш браузер устарел. Пожалуйста, обновите его для корректной работы сайта.');
        return;
    }

    // Инициализация форм
    initForms();

    // Плавная прокрутка для якорных ссылок
    initSmoothScroll();

    // Валидация форм
    initFormValidation();
});

// Инициализация плавной прокрутки
function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });

                // Обновление активного пункта меню
                updateActiveNavLink(targetId);
            }
        });
    });
}

// Обновление активной ссылки в навигации
function updateActiveNavLink(targetId) {
    const navLinks = document.querySelectorAll('.nav a');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === targetId) {
            link.classList.add('active');
        }
    });
}

// Инициализация форм
function initForms() {
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
        form.addEventListener('submit', function (e) {
            if (!validateForm(this)) {
                e.preventDefault();
                return false;
            }

            // Демонстрационная отправка
            console.log('Форма отправлена:', {
                action: this.action,
                method: this.method,
                data: new FormData(this)
            });

            // В реальном проекте здесь будет fetch или XMLHttpRequest
            // Для демо просто покажем сообщение
            showFormSuccess(this);
            e.preventDefault(); // Отменяем реальную отправку для демо
        });
    });
}

// Валидация формы
function validateForm(form) {
    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            markFieldAsInvalid(field, 'Это поле обязательно для заполнения');
            isValid = false;
        } else {
            markFieldAsValid(field);

            // Дополнительная валидация для email
            if (field.type === 'email') {
                if (!isValidEmail(field.value)) {
                    markFieldAsInvalid(field, 'Введите корректный email адрес');
                    isValid = false;
                }
            }

            // Дополнительная валидация для телефона
            if (field.type === 'tel') {
                if (!isValidPhone(field.value)) {
                    markFieldAsInvalid(field, 'Введите корректный номер телефона');
                    isValid = false;
                }
            }
        }
    });

    return isValid;
}

// Проверка email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Проверка телефона (упрощенная)
function isValidPhone(phone) {
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Отметка поля как невалидного
function markFieldAsInvalid(field, message) {
    field.style.borderColor = '#e74c3c';
    field.style.boxShadow = '0 0 0 2px rgba(231, 76, 60, 0.2)';

    // Удаляем старое сообщение об ошибке
    const oldError = field.parentNode.querySelector('.error-message');
    if (oldError) oldError.remove();

    // Добавляем новое сообщение об ошибке
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.color = '#e74c3c';
    errorDiv.style.fontSize = '0.85rem';
    errorDiv.style.marginTop = '5px';
    errorDiv.textContent = message;

    field.parentNode.appendChild(errorDiv);
}

// Отметка поля как валидного
function markFieldAsValid(field) {
    field.style.borderColor = '#2ecc71';
    field.style.boxShadow = '0 0 0 2px rgba(46, 204, 113, 0.2)';

    // Удаляем сообщение об ошибке
    const error = field.parentNode.querySelector('.error-message');
    if (error) error.remove();
}

// Инициализация валидации в реальном времени
function initFormValidation() {
    const inputs = document.querySelectorAll('input, textarea, select');

    inputs.forEach(input => {
        // Валидация при потере фокуса
        input.addEventListener('blur', function () {
            if (this.hasAttribute('required') && this.value.trim()) {
                if (this.type === 'email' && !isValidEmail(this.value)) {
                    markFieldAsInvalid(this, 'Введите корректный email адрес');
                } else if (this.type === 'tel' && !isValidPhone(this.value)) {
                    markFieldAsInvalid(this, 'Введите корректный номер телефона');
                } else {
                    markFieldAsValid(this);
                }
            }
        });

        // Сброс стилей при фокусе
        input.addEventListener('focus', function () {
            this.style.borderColor = '';
            this.style.boxShadow = '';

            const error = this.parentNode.querySelector('.error-message');
            if (error) error.remove();
        });
    });
}

// Показ успешного сообщения после отправки формы
function showFormSuccess(form) {
    // Создаем overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '1000';

    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.style.background = 'white';
    modal.style.padding = '2rem';
    modal.style.borderRadius = '10px';
    modal.style.textAlign = 'center';
    modal.style.maxWidth = '400px';
    modal.style.width = '90%';
    modal.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.3)';

    // Добавляем иконку успеха
    const icon = document.createElement('div');
    icon.style.fontSize = '3rem';
    icon.style.marginBottom = '1rem';
    icon.textContent = '✅';

    // Добавляем заголовок
    const title = document.createElement('h3');
    title.textContent = 'Успешно отправлено!';
    title.style.color = '#27ae60';
    title.style.marginBottom = '1rem';

    // Добавляем текст
    const text = document.createElement('p');
    text.textContent = 'Спасибо! Ваша форма была успешно отправлена. Мы свяжемся с вами в ближайшее время.';
    text.style.marginBottom = '1.5rem';

    // Добавляем кнопку закрытия
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Закрыть';
    closeBtn.style.background = '#3498db';
    closeBtn.style.color = 'white';
    closeBtn.style.border = 'none';
    closeBtn.style.padding = '10px 20px';
    closeBtn.style.borderRadius = '5px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontSize = '1rem';

    closeBtn.addEventListener('click', function () {
        document.body.removeChild(overlay);
        form.reset();
    });

    // Собираем модальное окно
    modal.appendChild(icon);
    modal.appendChild(title);
    modal.appendChild(text);
    modal.appendChild(closeBtn);
    overlay.appendChild(modal);

    // Добавляем на страницу
    document.body.appendChild(overlay);

    // Закрытие по клику на overlay
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
            form.reset();
        }
    });
}

// Вспомогательная функция для форматирования телефона
function formatPhoneNumber(phone) {
    // Простое форматирование для демонстрации
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9)}`;
    }
    return phone;
}

// Инициализация форматирования телефона
const phoneInputs = document.querySelectorAll('input[type="tel"]');
phoneInputs.forEach(input => {
    input.addEventListener('blur', function () {
        if (this.value) {
            this.value = formatPhoneNumber(this.value);
        }
    });
});

// Управление видимостью элементов при прокрутке
let lastScrollTop = 0;
const header = document.querySelector('.header');

window.addEventListener('scroll', function () {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > lastScrollTop && scrollTop > 100) {
        // Прокрутка вниз
        header.style.transform = 'translateY(-100%)';
    } else {
        // Прокрутка вверх
        header.style.transform = 'translateY(0)';
    }

    lastScrollTop = scrollTop;
});

// Анимация появления элементов при прокрутке
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    }, observerOptions);

    // Наблюдаем за секциями
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        observer.observe(section);
    });
}

// Инициализация анимаций при загрузке
if ('IntersectionObserver' in window) {
    initScrollAnimations();
}