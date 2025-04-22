document.addEventListener('DOMContentLoaded', function () {
	const menuContainer = document.getElementById('menu')
	const cartContainer = document.getElementById('cart')
	const totalPriceElement = document.getElementById('totalPrice')
	const submitButton = document.getElementById('submitOrder')
	const modal = document.getElementById('modification-modal')
	const modalProductName = document.getElementById('modal-product-name')
	const modalModifications = document.getElementById('modal-modifications')
	const confirmAddToCart = document.getElementById('confirm-add-to-cart')

	let cart = []

	let selectedItem = null

	let menuData = [] // Глобальная переменная для данных

	function groupMenuItems(menuData) {
		const groupedMenu = {}

		menuData.forEach(item => {
			const categoryName = item.category_name

			if (!groupedMenu[categoryName]) {
				groupedMenu[categoryName] = []
			}

			groupedMenu[categoryName].push(item)
		})

		return groupedMenu
	}

	function renderCategories() {
		menuContainer.innerHTML = ''

		const groupedMenu = groupMenuItems(menuData)

		Object.keys(groupedMenu).forEach(categoryName => {
			const categoryElement = document.createElement('div')
			categoryElement.classList.add('category-item')

			const categoryImage = document.createElement('img')
			const categoryItems = groupedMenu[categoryName]
			const categoryImageUrl = categoryItems[0].category_image

			categoryImage.src = categoryImageUrl
			categoryImage.alt = categoryName
			categoryElement.appendChild(categoryImage)

			const categoryTitle = document.createElement('h3')
			categoryTitle.textContent = categoryName
			categoryTitle.style.marginTop = '10px'
			categoryElement.appendChild(categoryTitle)

			categoryElement.dataset.category = categoryName
			categoryElement.addEventListener('click', () => {
				renderCategoryItems(categoryName, categoryItems)
			})

			menuContainer.appendChild(categoryElement)
		})
	}

	// Загружаем данные из JSON
	fetch('assets/menu.json')
		.then(response => response.json())
		.then(data => {
			menuData = data // Сохраняем глобально
			renderCategories() // Рендерим меню после загрузки
		})
		.catch(error => console.error('Ошибка при загрузке меню:', error))

	function renderCategoryItems(categoryName, categoryItems) {
		menuContainer.innerHTML = '' // Очищаем контейнер

		const categoryWrapper = document.createElement('div')
		categoryWrapper.classList.add('category-wrapper')

		const headerWrapper = document.createElement('div')
		headerWrapper.classList.add('header-wrapper')

		const backButton = document.createElement('button')
		backButton.innerHTML = '←'
		backButton.classList.add('back-button')
		backButton.addEventListener('click', () => {
			triggerSlideOutAnimation(categoryWrapper, () => {
				renderCategories()
			})
		})

		const title = document.createElement('h2')
		title.textContent = categoryName
		title.classList.add('category-title')

		headerWrapper.appendChild(backButton)
		headerWrapper.appendChild(title)

		let touchStartX = 0
		let touchEndX = 0

		function handleTouchStart(event) {
			touchStartX = event.touches[0].clientX
		}

		function handleTouchMove(event) {
			touchEndX = event.touches[0].clientX
		}

		function handleTouchEnd() {
			const swipeDistance = touchStartX - touchEndX
			if (swipeDistance < -50) {
				triggerSlideOutAnimation(categoryWrapper, () => {
					renderCategories()
				})
			}
		}

		categoryWrapper.addEventListener('touchstart', handleTouchStart, {
			passive: true,
		})
		categoryWrapper.addEventListener('touchmove', handleTouchMove, {
			passive: true,
		})
		categoryWrapper.addEventListener('touchend', handleTouchEnd, {
			passive: true,
		})

		const itemsWrapper = document.createElement('div')
		itemsWrapper.classList.add('items-wrapper')

		categoryItems.forEach(item => {
			const itemElement = document.createElement('div')
			itemElement.classList.add('menu-item')
			itemElement.innerHTML = `
            <div class="image-wrapper">
  					<img src="${item.image_url}" alt="${item.product_name}" class="product-image">
						</div>
            <h3>${item.product_name}</h3>
            <p>${item.price[1]} ₸</p>
            <button class="add-to-cart">Добавить</button>
        `
			itemElement
				.querySelector('.add-to-cart')
				.addEventListener('click', () => {
					openModificationModal(item)
				})
			itemsWrapper.appendChild(itemElement)
		})

		categoryWrapper.appendChild(headerWrapper)
		categoryWrapper.appendChild(itemsWrapper)
		menuContainer.appendChild(categoryWrapper)

		// Применяем эффект плавного появления
		requestAnimationFrame(() => {
			categoryWrapper.classList.add('slide-in')
		})
	}

	function triggerSlideOutAnimation(element, callback) {
		element.classList.add('slide-out')
		setTimeout(callback, 300) // Должно совпадать с transition в CSS (0.3s)
	}

	renderCategories()

	function openModificationModal(item) {
		selectedItem = item
		modalProductName.textContent = item.product_name
		modalModifications.innerHTML = ''

		let basePrice = parseFloat(item.price[1]) // Цена базового продукта
		let totalPrice = basePrice // Итоговая цена

		// Функция для пересчёта цены при выборе модификации
		function updateTotalPrice() {
			totalPrice = basePrice // Начинаем с базовой цены
			modal.querySelectorAll('input[type="radio"]:checked').forEach(input => {
				const modPrice = parseFloat(input.dataset.price) || 0
				totalPrice += modPrice
			})
			modalTotalPrice.textContent = `Итого: ${totalPrice.toFixed(2)} ₸`
		}

		item.group_modifications.forEach(group => {
			const groupContainer = document.createElement('div')
			groupContainer.classList.add('mod-group')

			const groupTitle = document.createElement('p')
			groupTitle.textContent = group.name
			groupTitle.classList.add('mod-title')

			groupContainer.appendChild(groupTitle)

			const modsWrapper = document.createElement('div')
			modsWrapper.classList.add('mod-wrapper')

			group.modifications.forEach((mod, index) => {
				const modCard = document.createElement('label')
				modCard.classList.add('mod-card')

				const radio = document.createElement('input')
				radio.type = 'radio'
				radio.name = `mod-${item.product_id}-${group.dish_modification_group_id}`
				radio.value = mod.dish_modification_id
				radio.dataset.price = mod.price
				if (index === 0) radio.checked = true

				const contentWrapper = document.createElement('div')
				contentWrapper.classList.add('content-wrapper')

				// Добавление изображения, если оно существует
				if (mod.image_url) {
					const modImage = document.createElement('img')
					modImage.src = mod.image_url
					modImage.alt = mod.name
					modImage.classList.add('modification-image')
					contentWrapper.appendChild(modImage)
				}

				const modText = document.createElement('span')
				modText.textContent = `${mod.name} (+${mod.price.toFixed(2)} ₸)`

				contentWrapper.appendChild(modText)

				radio.addEventListener('change', () => {
					document.querySelectorAll(`[name="${radio.name}"]`).forEach(input => {
						input.parentElement.classList.remove('selected')
					})
					modCard.classList.add('selected')
					updateTotalPrice()
				})

				modCard.appendChild(radio)
				modCard.appendChild(contentWrapper)
				modsWrapper.appendChild(modCard)

				if (radio.checked) {
					modCard.classList.add('selected')
				}
			})

			groupContainer.appendChild(modsWrapper)
			modalModifications.appendChild(groupContainer)
		})

		const commentLabel = document.createElement('p')
		commentLabel.textContent = 'Дополнительный комментарий:'
		commentLabel.classList.add('comment-label')

		const commentInput = document.createElement('textarea')
		commentInput.id = 'productComment'
		commentInput.classList.add('comment-input')

		modalModifications.appendChild(commentLabel)
		modalModifications.appendChild(commentInput)

		modalTotalPrice = document.createElement('p')
		modalTotalPrice.classList.add('total-price')
		modalTotalPrice.textContent = `Итого: ${totalPrice.toFixed(2)} ₸`
		modalModifications.appendChild(modalTotalPrice)

		modal.style.display = 'block'
	}

	confirmAddToCart.addEventListener('click', () => {
		const selectedMods = []
		modal.querySelectorAll('input[type="radio"]:checked').forEach(input => {
			selectedMods.push(input.value)
		})

		addToCart(selectedItem, selectedMods)
		modal.style.display = 'none'
	})

	document.querySelector('.close-btn').addEventListener('click', () => {
		modal.style.display = 'none'
	})

	window.addEventListener('click', event => {
		if (event.target === modal) {
			modal.style.display = 'none'
		}
	})

	function addToCart(item, selectedMods) {
		let basePrice = parseFloat(item.price[1])
		let totalPrice = basePrice

		const mods = selectedMods.map(id => {
			const mod = item.group_modifications
				.flatMap(group => group.modifications)
				.find(mod => mod.dish_modification_id == id)
			if (mod) totalPrice += parseFloat(mod.price)
			return {
				id: parseInt(id, 10),
				name: mod ? mod.name : 'Неизвестно',
				price: mod ? mod.price : 0,
			}
		})

		// Получаем комментарий
		const comment = document.getElementById('productComment').value || ''

		const existingItem = cart.find(
			cartItem =>
				cartItem.id === item.product_id &&
				JSON.stringify(cartItem.modifications) === JSON.stringify(mods) &&
				cartItem.comment === comment
		)

		if (existingItem) {
			existingItem.count += 1
		} else {
			cart.push({
				id: item.product_id,
				name: item.product_name,
				price: totalPrice,
				modifications: mods,
				comment: comment,
				count: 1,
			})
		}

		updateCart()
	}

	function updateCart() {
		cartContainer.innerHTML = ''
		let total = 0

		cart.forEach((item, index) => {
			total += item.price * item.count

			const cartItemElement = document.createElement('div')
			cartItemElement.classList.add('cart-item')
			cartItemElement.innerHTML = `
							<p>${item.name} (${item.modifications
				.map(m => `${m.name} (+${m.price.toFixed(2)})`)
				.join(', ')}) - ${item.price.toFixed(2)} x ${item.count}</p>
							<p class="cart-comment">${item.comment || '—'}</p>
							<button class="remove-btn" onclick="removeFromCart(${index})">&times;</button>
					`
			cartContainer.appendChild(cartItemElement)
		})

		totalPriceElement.textContent = `Итого: ${total.toFixed(2)}`
	}

	window.removeFromCart = function (index) {
		if (cart[index].count > 1) {
			cart[index].count -= 1
		} else {
			cart.splice(index, 1)
		}
		updateCart()
	}

	function showPopup(message) {
		const popupOverlay = document.getElementById('popup-overlay')
		const popup = document.getElementById('custom-popup')
		const popupMessage = document.getElementById('popup-message')

		popupMessage.textContent = message
		popupOverlay.classList.add('active')
		popup.classList.add('active')

		setTimeout(() => {
			hidePopup()
		}, 3000) // Закрытие через 3 сек
	}

	function hidePopup() {
		const popupOverlay = document.getElementById('popup-overlay')
		const popup = document.getElementById('custom-popup')
		popupOverlay.classList.remove('active')
		popup.classList.remove('active')
	}

	// Закрытие по клику на фон или кнопку
	document.querySelector('.close-popup').addEventListener('click', hidePopup)
	document.getElementById('popup-overlay').addEventListener('click', hidePopup)

	function showLoading() {
		document.getElementById('loading-overlay').style.visibility = 'visible'
	}

	function hideLoading() {
		document.getElementById('loading-overlay').style.visibility = 'hidden'
	}

	function submitOrder() {
		const customerName = document.getElementById('customerName').value.trim()

		if (!customerName) {
			showPopup('Ошибка: введите имя перед оформлением заказа!')
			return
		}

		if (cart.length === 0) {
			showPopup('Ошибка: нет товаров в заказе!')
			return
		}

		const order = {
			total: cart.reduce((sum, item) => sum + item.price * item.count, 0),
			comment: customerName,
			products: cart.map(item => ({
				id: parseInt(item.id, 10),
				count: item.count,
				price: item.price,
				comment: item.comment,
				modification: item.modifications.map(mod => ({
					id: mod.id,
					count: 1,
				})),
			})),
		}

		const cartModal = document.getElementById('cartModal')
		console.log('Отправляем заказ:', JSON.stringify(order, null, 2))

		showLoading()

		fetch('/orders', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(order),
		})
			.then(response => {
				return response.json().then(data => {
					if (!response.ok) {
						throw new Error(
							data.error || 'Произошла ошибка при обработке запроса'
						)
					}
					return data // Возвращаем успешный ответ
				})
			})
			.then(data => {
				console.log('Ответ сервера:', data)

				showPopup('Заказ успешно отправлен!')
				document.getElementById('customerName').value = ''

				// Очищаем корзину
				document.getElementById('customerName').value = ''
				cart = []
				localStorage.removeItem('cart')
				updateCart()

				// Закрываем корзину (если у тебя есть функция для этого)
				cartModal.style.display = 'none'
			})
			.catch(error => {
				console.error('Ошибка:', error)
				showPopup('Ошибка заказа: ' + error.message)

				// Очищаем корзину и закрываем её даже при ошибке
				document.getElementById('customerName').value = ''
				cart = []
				localStorage.removeItem('cart')
				updateCart()
				cartModal.style.display = 'none'
			})
			.finally(() => {
				hideLoading() // Скрыть loader в любом случае
			})
	}

	submitButton.addEventListener('click', submitOrder)

	renderMenu()
})

document.addEventListener('DOMContentLoaded', function () {
	const cartButton = document.getElementById('cartButton')
	const cartModal = document.getElementById('cartModal')
	const cartCloseBtn = document.querySelector('#cartModal .close-btn')
	if (!cartButton || !cartModal) {
		console.error('Элементы корзины не найдены!')
		return
	}

	// Открытие корзины по кнопке
	cartButton.addEventListener('click', function () {
		cartModal.style.display = 'block'
	})

	// Закрытие корзины по клику вне окна
	window.addEventListener('click', function (event) {
		if (event.target === cartModal) {
			cartModal.style.display = 'none'
		}
	})

	// Закрытие корзины по кнопке "×"
	if (cartCloseBtn) {
		cartCloseBtn.addEventListener('click', function () {
			cartModal.style.display = 'none'
		})
	}
})

document.addEventListener('DOMContentLoaded', () => {
	const qrCodeContainer = document.getElementById('qr-code-container')
	const qrCodeImage = document.getElementById('qr-code-image')
	const closeBtn = document.getElementById('close-btn')

	// Путь к QR-кодам для каждого типа
	const qrCodes = {
		mail: 'assets/logo/mail-qr.png',
		wa: 'assets/logo/wa-qr.png',
		tg: 'assets/logo/tg-qr.png',
	}

	// Обработчик клика на иконку
	document.querySelectorAll('.contact-item').forEach(item => {
		item.addEventListener('click', () => {
			const type = item.getAttribute('data-type')
			const qrCodePath = qrCodes[type]

			if (qrCodePath) {
				qrCodeImage.src = qrCodePath
				qrCodeContainer.style.display = 'flex'
			}
		})
	})

	// Закрытие QR-кода
	closeBtn.addEventListener('click', () => {
		qrCodeContainer.style.display = 'none'
	})

	// Закрытие при клике вне области QR-кода
	qrCodeContainer.addEventListener('click', event => {
		if (event.target === qrCodeContainer) {
			qrCodeContainer.style.display = 'none'
		}
	})
})

let idleTimeout
const idleTimeLimit = 60000 // 60 секунд
const idleOverlay = document.getElementById('idle-overlay')

function showIdleOverlay() {
	idleOverlay.classList.add('show')
}

function hideIdleOverlay() {
	idleOverlay.classList.remove('show')
}

function resetIdleTimer() {
	clearTimeout(idleTimeout)
	hideIdleOverlay()
	idleTimeout = setTimeout(showIdleOverlay, idleTimeLimit)
}

// Сброс по любому действию
;['mousemove', 'keydown', 'touchstart', 'click'].forEach(event => {
	document.addEventListener(event, resetIdleTimer)
})

// Запуск отсчёта при загрузке
resetIdleTimer()

let keyboard
let currentInput

function showKeyboard(input) {
	currentInput = input
	document.getElementById('keyboard').style.display = 'block'

	if (!keyboard) {
		console.log('Инициализация клавиатуры')
		keyboard = new window.SimpleKeyboard.default({
			onChange: inputVal => {
				console.log('Изменение значения клавиатуры:', inputVal)
				if (currentInput) currentInput.value = inputVal
			},
			onKeyPress: button => {
				console.log('Нажата клавиша:', button)
				if (button === '{bksp}') {
					currentInput.value = currentInput.value.slice(0, -1)
					keyboard.setInput(currentInput.value)
				}
			},
		})
	}

	keyboard.setInput(input.value)
}

function hideKeyboard() {
	console.log('Скрытие клавиатуры')
	document.getElementById('keyboard').style.display = 'none'
	currentInput = null
}

document.addEventListener('DOMContentLoaded', () => {
	// Находим контейнер модального окна, если он существует
	const modal = document.getElementById('modalContainer')
	if (!modal) {
		console.error('Не найден контейнер модального окна!')
	} else {
		console.log('Модальное окно найдено!')
	}

	// Привязываем обработчик на модальное окно, чтобы ловить фокус на инпуты внутри
	if (modal) {
		modal.addEventListener(
			'focus',
			event => {
				const input = event.target
				console.log('Фокус на элементе:', input)
				if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA') {
					showKeyboard(input)
				}
			},
			true
		) // true - для захвата события на этапе capturing
	}

	// Клик вне модального окна - закрытие клавиатуры
	document.addEventListener('mousedown', event => {
		const keyboardEl = document.getElementById('keyboard')
		const isClickInsideKeyboard = keyboardEl.contains(event.target)
		const isClickOnInput = modal && modal.contains(event.target) // Проверка внутри модального окна

		if (!isClickInsideKeyboard && !isClickOnInput) {
			hideKeyboard()
		}
	})

	// Обработчик для динамически добавленных элементов
	document.body.addEventListener(
		'focus',
		event => {
			const input = event.target
			console.log('Динамический фокус на элементе:', input)
			if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA') {
				showKeyboard(input)
			}
		},
		true
	) // Событие захвата на всем теле документа

	// Проверим, если элементы уже есть на странице (например, инпуты в корзине)
	const inputs = document.querySelectorAll(
		"input[type='text'], input[type='number'], textarea"
	)
	inputs.forEach(input => {
		input.addEventListener('focus', () => showKeyboard(input))
	})
})

let currentLayout = 'default' // "default" - англ, "ru" - рус

keyboard = new window.SimpleKeyboard.default({
	layout: {
		default: [
			'` 1 2 3 4 5 6 7 8 9 0 - = {bksp}',
			'q w e r t y u i o p [ ] \\',
			"a s d f g h j k l ; '",
			'z x c v b n m , . /',
			'{lang} {space}',
		],
		ru: [
			'ё 1 2 3 4 5 6 7 8 9 0 - = {bksp}',
			'й ц у к е н г ш щ з х ъ \\',
			'ф ы в а п р о л д ж э',
			'я ч с м и т ь б ю .',
			'{lang} {space}',
		],
	},
	display: {
		'{bksp}': '⌫',
		'{space}': '␣',
		'{lang}': '🌐',
	},
	layoutName: currentLayout,
	onChange: inputVal => {
		if (currentInput) currentInput.value = inputVal
	},
	onKeyPress: button => {
		console.log('Нажата клавиша:', button)

		if (button === '{bksp}') {
			currentInput.value = currentInput.value.slice(0, -1)
			keyboard.setInput(currentInput.value)
		}

		if (button === '{lang}') {
			currentLayout = currentLayout === 'default' ? 'ru' : 'default'
			keyboard.setOptions({ layoutName: currentLayout })
		}
	},
})

document.getElementById('toggleLayout').addEventListener('click', () => {
	currentLayout = currentLayout === 'default' ? 'ru' : 'default'
	keyboard.setOptions({ layoutName: currentLayout })
})
