class DashboardManager {
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.eventMessageElement = document.getElementById("Nuevo");
    this.detailsButton = document.getElementById("more-details-btn");
    this.activityListElement = document.getElementById("activity-list");
    this.activities =
      JSON.parse(localStorage.getItem("recentActivities")) || [];
    if (!this.eventMessageElement || !this.detailsButton) {
      console.error("Elementos HTML no encontrados:", {
        eventMessageElement: this.eventMessageElement,
        detailsButton: this.detailsButton,
      });
    }
  }

  // Method to update dashboard, now public to allow external calls
  updateDashboard() {
    const totalAnimals = document.getElementById("total-animals");
    const avgWeight = document.getElementById("avg-weight");
    const totalVaccines = document.getElementById("total-vaccines");

    const animals = this.dataManager.getAnimals();
    const vaccines = this.dataManager.getVaccines();

    if (totalAnimals) {
      totalAnimals.textContent = animals.length || "0";
    } else {
      console.error("Elemento total-animals no encontrado");
    }
    if (avgWeight) {
      const totalWeight = animals.reduce(
        (sum, a) => sum + (parseFloat(a.weight) || 0),
        0
      );
      const average = animals.length > 0 ? totalWeight / animals.length : 0;
      avgWeight.textContent =
        animals.length > 0 ? average.toFixed(2) + " kg" : "N/A";
    } else {
      console.error("Elemento avg-weight no encontrado");
    }
    if (totalVaccines) {
      const pendingVaccines = vaccines.filter((v) => !v.completed).length;
      totalVaccines.textContent = pendingVaccines || "0" + " pendientes";
    } else {
      console.error("Elemento total-vaccines no encontrado");
    }

    this.updateUpcomingEvents();
    this.updateRecentActivity();
  }

  updateUpcomingEvents() {
    if (!this.eventMessageElement || !this.detailsButton) {
      console.error("Elemento Nuevo o more-details-btn no encontrado");
      return;
    }

    const now = new Date("2025-05-26T15:30:00-05:00"); // Updated to current date and time

    const vaccines = this.dataManager.getVaccines(); // Fetch latest data
    const upcoming = vaccines
      .filter((v) => {
        if (
          !v.nextDoseDate ||
          !v.animalId ||
          !v.name ||
          v.completed === undefined
        ) {
          console.warn("Vacuna con datos incompletos:", v);
          return false;
        }
        const dateObj = new Date(v.nextDoseDate);
    
        return !v.completed && !isNaN(dateObj.getTime());
      })
      .map((v) => ({ ...v, dateObj: new Date(v.nextDoseDate) }))
      .sort((a, b) => a.dateObj - b.dateObj);

 

    if (upcoming.length > 0) {
      const closestEvent = upcoming[0];
      const timeDiff = closestEvent.dateObj - now;
      const daysRemaining = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      console.log(
        `Closest event: ${closestEvent.name}, daysRemaining: ${daysRemaining}`
      );

      this.eventMessageElement.textContent = `Faltan ${daysRemaining} día(s) para el próximo evento`;
      this.detailsButton.style.display = "block";
      this.detailsButton.onclick = () => this.showDetailsModal(upcoming);
    } else {
      this.eventMessageElement.textContent = "No hay vacunas pendientes.";
      this.detailsButton.style.display = "none";
    }
  }

  showDetailsModal(upcomingEvents) {
    console.log("Showing modal with events:", upcomingEvents);

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";

    const modal = document.createElement("div");
    modal.className = "modal-content";
    modal.style.minHeight = "400px"; // Fixed minimum height for consistency
    modal.innerHTML = `
            <h2>Detalles de Próximas Vacunas</h2>
            <table class="dashboard-table" style="width: 100%; table-layout: fixed;">
                <thead>
                    <tr class="dashboard-table-header-row">
                        <th class="dashboard-table-header">Animal</th>
                        <th class="dashboard-table-header">Vacuna</th>
                        <th class="dashboard-table-header">Días Faltantes</th>
                        <th class="dashboard-table-header">Cuenta Regresiva</th>
                    </tr>
                </thead>
                <tbody id="upcoming-events-table"></tbody>
            </table>
            <div class="modal-actions" style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center;">
                <button id="prev-page-btn" style="padding: 5px 10px; background-color: var(--color-primary); color: var(--color-text-white); border: 1px solid var(--color-border); border-radius: var(--border-radius);">Anterior</button>
                <span id="page-info" style="color: var(--color-text); font-weight: 500;"></span>
                <button id="next-page-btn" style="padding: 5px 10px; background-color: var(--color-primary); color: var(--color-text-white); border: 1px solid var(--color-border); border-radius: var(--border-radius);">Siguiente</button>
            </div>
            <button id="close-modal-btn" class="btn-delete" style="margin-top: 10px; padding: 8px 16px;">Cerrar</button>
        `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const ROWS_PER_PAGE = 10;
    let currentPage = 1;

    const updateTable = () => {
      const tbody = document.getElementById("upcoming-events-table");
      if (!tbody) return;

      const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
      const endIndex = startIndex + ROWS_PER_PAGE;
      const paginatedEvents = upcomingEvents.slice(startIndex, endIndex);

      // Fill with empty rows if less than ROWS_PER_PAGE
      const rowsToFill = ROWS_PER_PAGE - paginatedEvents.length;
      const filledEvents = [
        ...paginatedEvents,
        ...Array(rowsToFill)
          .fill()
          .map(() => ({
            animalId: null,
            name: "Sin datos",
            dateObj: new Date(),
            completed: true, // To avoid filtering issues
          })),
      ];

      tbody.innerHTML = filledEvents
        .map((event) => {
          const animalName = this.getAnimalName(event.animalId) || "N/A";
          const timeDiff = event.dateObj ? event.dateObj - new Date() : 0;
          const daysRemaining = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
          const hoursRemaining = Math.floor(
            (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          );
          const minutesRemaining = Math.floor(
            (timeDiff % (1000 * 60 * 60)) / (1000 * 60)
          );
          const secondsRemaining = Math.floor((timeDiff % (1000 * 60)) / 1000);

          const countdownText =
            event.animalId !== null && daysRemaining >= 0
              ? `${daysRemaining}d ${hoursRemaining}h ${minutesRemaining}m ${secondsRemaining}s`
              : "N/A";

          return `
                   <tr
  className="dashboard-table-row"
  style={{
    opacity: event.animalId === null ? 0.5 : 1,
    color: 'var(--color-text)',
  }}
>
                        <td class="dashboard-table-cell">${animalName}</td>
                        <td class="dashboard-table-cell">${event.name}</td>
                        <td class="dashboard-table-cell">${
                          event.animalId !== null
                            ? daysRemaining >= 0
                              ? daysRemaining
                              : 0
                            : "N/A"
                        }</td>
                        <td class="dashboard-table-cell countdown-cell">
                            <span class="countdown-value">${countdownText}</span>
                        </td>
                    </tr>
                `;
        })
        .join("");

      const totalPages = Math.ceil(upcomingEvents.length / ROWS_PER_PAGE);
      document.getElementById(
        "page-info"
      ).textContent = `Página ${currentPage} de ${totalPages || 1}`;
      document.getElementById("prev-page-btn").disabled = currentPage === 1;
      document.getElementById("next-page-btn").disabled =
        currentPage === totalPages || totalPages === 0;
    };

    const prevPage = () => {
      if (currentPage > 1) {
        currentPage--;
        updateTable();
      }
    };

    const nextPage = () => {
      const totalPages = Math.ceil(upcomingEvents.length / ROWS_PER_PAGE);
      if (currentPage < totalPages) {
        currentPage++;
        updateTable();
      }
    };

    document
      .getElementById("prev-page-btn")
      .addEventListener("click", prevPage);
    document
      .getElementById("next-page-btn")
      .addEventListener("click", nextPage);

    updateTable();
    const intervalId = setInterval(updateTable, 1000); // Update every second for real-time countdown

    const closeModal = () => {
      clearInterval(intervalId);
      if (overlay && document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    };

    modal
      .querySelector("#close-modal-btn")
      .addEventListener("click", closeModal);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });
  }

  getAnimalName(animalId) {
    const animal = this.dataManager.getAnimals().find((a) => a.id === animalId);
    return animal ? animal.name : "Desconocido";
  }

  addActivity(text) {
    const now = new Date();
    const timestamp = now.toLocaleString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    this.activities.unshift({ time: timestamp, text });
    this.activities = this.activities.slice(0, 5);
    localStorage.setItem("recentActivities", JSON.stringify(this.activities));
    this.updateRecentActivity();
  }

  updateRecentActivity() {
    if (!this.activityListElement) {
      
      return;
    }

    this.activityListElement.innerHTML =
      this.activities.length > 0
        ? this.activities
            .map(
              (activity) => `
                <li class="activity-item">
                    <span class="activity-time">${activity.time}</span>
                    <span class="activity-text">${activity.text}</span>
                </li>
            `
            )
            .join("")
        : '<li class="activity-item"><span>No hay actividad reciente</span></li>';
  }
}
