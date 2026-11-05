
/* =====================================
   MENU DE NAVEGAÇÃO
===================================== */

const menuToggle = document.getElementById("menu-toggle");
const navigation = document.getElementById("navigation");

menuToggle.addEventListener("click", () => {

    navigation.classList.toggle("active");

    const isOpen = navigation.classList.contains("active");

    menuToggle.setAttribute("aria-expanded", isOpen);

    menuToggle.setAttribute(
        "aria-label",
        isOpen ? "Fechar menu" : "Abrir menu"
    );

    menuToggle.textContent = isOpen ? "✕" : "☰";

});

navigation.querySelectorAll("a").forEach(link => {

    link.addEventListener("click", () => {

        navigation.classList.remove("active");

        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Abrir menu");

        menuToggle.textContent = "☰";

    });

});


/* =====================================
   CONFIGURAÇÕES DA AGENDA
===================================== */

const schedule = {

    days: [1, 2, 3, 4, 5, 6],

    start: "09:00",

    end: "18:00",

    duration: 50,

    modalities: ["Online", "Presencial"]

};


/* =====================================
   ELEMENTOS DO FORMULÁRIO
===================================== */

const dateInput = document.getElementById("appointment-date");

const timeContainer = document.getElementById("available-times");

const selectedTimeInput = document.getElementById("selected-time");

const bookingForm = document.getElementById("booking-form");

const feedback = document.getElementById("booking-feedback");


/* =====================================
   DATA LOCAL
===================================== */

function getLocalDate(date = new Date()) {

    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, "0");

    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;

}

const today = getLocalDate();

dateInput.min = today;


/* =====================================
   GERAÇÃO DOS HORÁRIOS
===================================== */

function generateHours() {

    const hours = [];

    const [startHour, startMinute] =
        schedule.start.split(":").map(Number);

    const [endHour, endMinute] =
        schedule.end.split(":").map(Number);

    let current = startHour * 60 + startMinute;

    const end = endHour * 60 + endMinute;

    while (current + schedule.duration <= end) {

        const hour = String(Math.floor(current / 60)).padStart(2, "0");

        const minute = String(current % 60).padStart(2, "0");

        hours.push(`${hour}:${minute}`);

        current += schedule.duration;

    }

    return hours;

}

const availableHours = generateHours();


/* =====================================
   ARMAZENAMENTO DEMONSTRATIVO
===================================== */

function getBookedSlots() {

    try {

        return JSON.parse(
            localStorage.getItem("demoBookedSlots") || "[]"
        );

    } catch {

        return [];

    }

}


/* =====================================
   VALIDAÇÃO DE DATA
===================================== */

function isValidDate(value) {

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {

        return false;

    }

    const date = new Date(value + "T12:00:00");

    return !isNaN(date.getTime()) &&
        getLocalDate(date) === value;

}


/* =====================================
   EXIBIR MENSAGENS
===================================== */

function showFeedback(message, type) {

    feedback.textContent = message;

    feedback.className = type;

}


/* =====================================
   EXIBIR HORÁRIOS DISPONÍVEIS
===================================== */

function renderAvailableHours() {

    const selectedDate = dateInput.value;

    timeContainer.innerHTML = "";

    selectedTimeInput.value = "";

    if (!isValidDate(selectedDate) || selectedDate < getLocalDate()) {

        timeContainer.innerHTML =
            '<p class="time-message">Selecione uma data válida.</p>';

        return;

    }

    const date = new Date(selectedDate + "T12:00:00");

    // Domingo não possui atendimento

    if (!schedule.days.includes(date.getDay())) {

        timeContainer.innerHTML =
            '<p class="time-message">Não há atendimento aos domingos. Escolha outro dia.</p>';

        return;

    }

    const bookedSlots = getBookedSlots();

    availableHours.forEach(hour => {

        const slotKey = `${selectedDate}_${hour}`;

        const isBooked = bookedSlots.includes(slotKey);

        const appointmentDate = new Date(
            `${selectedDate}T${hour}:00`
        );

        const isPast = appointmentDate <= new Date();

        const button = document.createElement("button");

        button.type = "button";

        button.className = "time-option";

        button.textContent = isBooked
            ? "Ocupado"
            : isPast
                ? "Encerrado"
                : hour;

        button.disabled = isBooked || isPast;

        button.addEventListener("click", () => {

            document.querySelectorAll(".time-option")
                .forEach(item => {

                    item.classList.remove("selected");

                });

            button.classList.add("selected");

            selectedTimeInput.value = hour;

            showFeedback("", "");

        });

        timeContainer.appendChild(button);

    });

}


// Atualiza os horários ao selecionar uma data

dateInput.addEventListener("change", () => {

    showFeedback("", "");

    renderAvailableHours();

});


/* =====================================
   ENVIO DO AGENDAMENTO
===================================== */

bookingForm.addEventListener("submit", (event) => {

    event.preventDefault();

    const modality = document.getElementById("modality").value;

    const date = dateInput.value;

    const time = selectedTimeInput.value;

    const name = document.getElementById("patient-name").value.trim();

    const email = document.getElementById("patient-email").value.trim();

    const phone = document.getElementById("patient-phone").value.trim();


    // Verificação dos campos

    if (!modality || !date || !time || !name || !email || !phone) {

        showFeedback(
            "Preencha todos os campos e escolha um horário.",
            "error"
        );

        return;

    }


    // Verificação da modalidade

    if (!schedule.modalities.includes(modality)) {

        showFeedback("Modalidade inválida.", "error");

        return;

    }


    // Verificação da data

    if (!isValidDate(date) || date < getLocalDate()) {

        showFeedback("Escolha uma data válida.", "error");

        return;

    }


    // Verificação do dia da semana

    const weekday = new Date(date + "T12:00:00").getDay();

    if (!schedule.days.includes(weekday)) {

        showFeedback("A psicóloga não atende neste dia.", "error");

        return;

    }


    // Verificação do horário

    if (!availableHours.includes(time)) {

        showFeedback("Horário inválido.", "error");

        return;

    }


    // Verificação de horários ocupados

    const bookedSlots = getBookedSlots();

    const slotKey = `${date}_${time}`;

    if (bookedSlots.includes(slotKey)) {

        showFeedback(
            "Este horário já está ocupado. Escolha outro.",
            "error"
        );

        renderAvailableHours();

        return;

    }


    // Verificação de horário passado

    const appointmentDate = new Date(`${date}T${time}:00`);

    if (appointmentDate <= new Date()) {

        showFeedback("Este horário já passou.", "error");

        renderAvailableHours();

        return;

    }


    // Registro demonstrativo do horário

    bookedSlots.push(slotKey);

    localStorage.setItem(
        "demoBookedSlots",
        JSON.stringify(bookedSlots)
    );


    // Mensagem de retorno

    showFeedback(
        `Solicitação demonstrativa registrada! ${name}, horário ${date} às ${time}. Modalidade: ${modality}. Esta não é uma consulta confirmada.`,
        "success"
    );


    // Limpa o formulário

    bookingForm.reset();

    selectedTimeInput.value = "";

    renderAvailableHours();

});
