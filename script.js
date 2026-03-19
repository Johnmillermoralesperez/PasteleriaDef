// =====================
// VARIABLES GLOBALES
// =====================
let cart = [];
let total = 0;
let clientData = null;

let paymentMethod = null;
let shippingMethod = 'estandar';
let shippingCost = 50;
let shippingData = null;

// =====================
// VARIABLES NUEVAS
// =====================
let loggedUser = null;
let birthdayDiscount = 0;

// =====================
// MODAL INFO
// =====================
function openInfoModal(){
    document.getElementById('infoModal').style.display='flex';
}
function closeInfoModal(){
    document.getElementById('infoModal').style.display='none';
}

// =====================
// LOGIN + DESCUENTO
// =====================
function openLoginModal(){
    document.getElementById('loginModal').style.display='flex';
}
function closeLoginModal(){
    document.getElementById('loginModal').style.display='none';
}

function loginUser(e){
    e.preventDefault();
    const name=document.getElementById('loginName').value;
    const birthday=document.getElementById('loginBirthday').value;

    loggedUser={name,birthday};
    localStorage.setItem("user",JSON.stringify(loggedUser));

    checkBirthdayDiscount();
    closeLoginModal();
    alert("Sesión iniciada correctamente 🎉");
}

function checkBirthdayDiscount(){
    const today=new Date().toISOString().slice(5,10);
    const user=JSON.parse(localStorage.getItem("user"));
    if(user){
        const birth=user.birthday.slice(5,10);
        if(today===birth){
            birthdayDiscount=0.10;
            alert("🎂 ¡Feliz Cumpleaños! Tienes 10% de descuento.");
        }
    }
}

// =====================
// CARRITO
// =====================
function toggleCart() {
    const cartEl = document.getElementById('cart');
    cartEl.style.display === 'flex' ? closeCart() : openCart();
}

function openCart() {
    const cartEl = document.getElementById('cart');
    cartEl.style.display = 'flex';
    cartEl.classList.add('cart-open');
    document.body.style.overflow = 'hidden';
    updateCartCount();
}

function closeCart() {
    const cartEl = document.getElementById('cart');
    cartEl.classList.remove('cart-open');
    setTimeout(() => {
        cartEl.style.display = 'none';
        document.body.style.overflow = '';
    }, 300);
}

function addToCart(name, price, stockId) {

    const item = cart.find(p => p.name === name);

    if (item) {
        item.quantity++;
        item.subtotal = item.quantity * item.price;
    } else {
        cart.push({
            name,
            price,
            quantity: 1,
            subtotal: price,
            stockId: stockId
        });
    }

    recalculateTotal();
    renderCart();
    showNotification(`${name} agregado`, 'success');
}

// =====================
// CONTROL DE STOCK
// =====================
function comprarPastel(stockId, nombre, precio){

    let stockElemento = document.getElementById(stockId);

    let texto = stockElemento.innerText.replace("Existencia: ","");
    let cantidad = texto === "Agotado" ? 0 : parseInt(texto);

    if(cantidad > 0){

        cantidad--;

        if(cantidad === 0){
            stockElemento.innerText = "Agotado";
            stockElemento.style.color = "red";
        }else{
            stockElemento.innerText = "Existencia: " + cantidad;
        }

        addToCart(nombre, precio, stockId);

    }else{
        alert("Producto agotado");
    }
}

function removeFromCart(index) {

    let item = cart[index];
    let stockElemento = document.getElementById(item.stockId);

    let texto = stockElemento.innerText.replace("Existencia: ","");
    let stock = texto === "Agotado" ? 0 : parseInt(texto);

    stock += item.quantity;

    stockElemento.innerText = "Existencia: " + stock;
    stockElemento.style.color = "";

    cart.splice(index, 1);

    recalculateTotal();
    renderCart();
}

function updateQuantity(index, qty) {

    let item = cart[index];
    let stockElemento = document.getElementById(item.stockId);

    let texto = stockElemento.innerText.replace("Existencia: ","");
    let stock = texto === "Agotado" ? 0 : parseInt(texto);

    if(qty > item.quantity){
        if(stock <= 0){
            alert("No hay más stock");
            return;
        }
        stock--;
    }

    if(qty < item.quantity){
        stock++;
    }

    if(stock <= 0){
        stockElemento.innerText = "Agotado";
        stockElemento.style.color = "red";
    }else{
        stockElemento.innerText = "Existencia: " + stock;
        stockElemento.style.color = "";
    }

    if (qty < 1) return removeFromCart(index);
    if (qty > 10) return showNotification('Máx 10 piezas', 'warning');

    cart[index].quantity = qty;
    cart[index].subtotal = qty * cart[index].price;

    recalculateTotal();
    renderCart();
}

function recalculateTotal() {
    total = cart.reduce((s, i) => s + i.subtotal, 0);
}

function renderCart() {
    const list = document.getElementById('cartItems');
    const totalEl = document.getElementById('total');
    const empty = document.getElementById('cartEmpty');
    const btn = document.querySelector('.btn-checkout');

    list.innerHTML = '';

    if (!cart.length) {
        empty.style.display = 'block';
        btn.disabled = true;
        totalEl.textContent = '0';
        updateCartCount();
        return;
    }

    empty.style.display = 'none';
    btn.disabled = false;

    cart.forEach((item, i) => {
        list.innerHTML += `
        <li>
            ${item.name} ($${item.price})
            <button onclick="updateQuantity(${i}, ${item.quantity - 1})">-</button>
            ${item.quantity}
            <button onclick="updateQuantity(${i}, ${item.quantity + 1})">+</button>
            <button onclick="removeFromCart(${i})">❌</button>
        </li>`;
    });

    totalEl.textContent = total.toFixed(2);
    updateCartCount();
}

function updateCartCount() {
    document.getElementById('count').textContent =
        cart.reduce((s, i) => s + i.quantity, 0);
}

// =====================
// CHECKOUT
// =====================
function openCheckout() {
    if (!cart.length) {
        showNotification('Carrito vacío', 'warning');
        return;
    }
    closeCart();
    openPaymentModal();
}
// =====================
// PAGO
// =====================
function openPaymentModal() {
    document.getElementById('paymentModal').style.display = 'flex';
}

function closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';
}

function selectPaymentMethod(method) {
    paymentMethod = method;
}

function continueToShipping() {
    if (!paymentMethod) {
        showNotification('Selecciona método de pago', 'warning');
        return;
    }

    closePaymentModal();

    if (paymentMethod === 'tarjeta') openCardModal();
    else if (paymentMethod === 'transferencia') openTransferModal();
    else openShippingModal();
}

// =====================
// TARJETA
// =====================
function openCardModal() {
    document.getElementById('cardModal').style.display = 'flex';
}

function closeCardModal() {
    document.getElementById('cardModal').style.display = 'none';
}

function processCardPayment(e) {
    e.preventDefault();
    closeCardModal();
    openShippingModal();
}

// =====================
// TRANSFERENCIA
// =====================
function openTransferModal() {
    document.getElementById('transferAmount').textContent =
        (total + shippingCost).toFixed(2);
    document.getElementById('transferModal').style.display = 'flex';
}

function closeTransferModal() {
    document.getElementById('transferModal').style.display = 'none';
}

function confirmTransferPayment() {
    closeTransferModal();
    openShippingModal();
}

// =====================
// ENVÍO
// =====================
function openShippingModal() {
    document.getElementById('shippingModal').style.display = 'flex';
}

function closeShippingModal() {
    document.getElementById('shippingModal').style.display = 'none';
}

function selectShippingMethod(method) {
    shippingMethod = method;
    shippingCost = method === 'expreso' ? 100 : method === 'recoger' ? 0 : 50;
}

function confirmShipping(e) {
    e.preventDefault();

    shippingData = {
        address: shippingAddress.value,
        city: shippingCity.value,
        zip: shippingZip.value,
        phone: shippingPhone.value,
        date: shippingDate.value,
        notes: shippingNotes.value
    };

    closeShippingModal();
    processPayment();
}

// =====================
// PAGO FINAL + RECIBO
// =====================
function processPayment() {
    generateReceipt();
    cart = [];
    total = 0;
    paymentMethod = null;
    shippingData = null;
    renderCart();
    showNotification('Compra realizada con éxito 🎉', 'success');
}

// =====================
// ACTUALIZACIÓN DEL RECIBO
// =====================
function generateReceipt() {
    let discountAmount = total * birthdayDiscount;
    let finalTotal = (total - discountAmount) + shippingCost;

    const receipt = `
🧾 RECIBO
Cliente: ${loggedUser?.name || 'Cliente'}
Subtotal: $${total.toFixed(2)}
Descuento Cumpleaños: -$${discountAmount.toFixed(2)}
Envío: $${shippingCost}
TOTAL FINAL: $${finalTotal.toFixed(2)}
`;

    alert(receipt);
}

// =====================
// UTILIDADES
// =====================
function showNotification(msg, type) {
    const n = document.createElement('div');
    n.textContent = msg;
    n.style.cssText = `
        position:fixed;top:20px;right:20px;
        background:#333;color:#fff;
        padding:12px;border-radius:6px;z-index:9999`;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3000);
}

// =====================
// VISUALIZACIÓN IMÁGENES (LIGHTBOX)
// =====================
document.addEventListener("DOMContentLoaded",()=>{
    renderCart();
    
    // Autoformato del número de tarjeta
    const cardInput = document.getElementById("cardNumber");
    if (cardInput) {
        cardInput.addEventListener("input", function (e) {
            let value = e.target.value.replace(/\D/g, "");
            value = value.substring(0, 16);
            value = value.replace(/(.{4})/g, "$1 ").trim();
            e.target.value = value;
        });
    }
    
    // Lightbox para imágenes de productos
    document.querySelectorAll(".product-image img").forEach(img=>{
        img.addEventListener("click",()=>{
            const overlay=document.createElement("div");
            overlay.className="lightbox";
            overlay.innerHTML=`<img src="${img.src}">`;
            overlay.onclick=()=>overlay.remove();
            document.body.appendChild(overlay);
        });
    });
});