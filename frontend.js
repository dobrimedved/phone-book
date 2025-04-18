document.addEventListener("DOMContentLoaded", function () {
  // Элементы DOM
  const authSection = document.getElementById("authSection");
  const appSection = document.getElementById("appSection");
  const loginForm = document.getElementById("loginForm");
  const logoutBtn = document.getElementById("logoutBtn");
  const addContactForm = document.getElementById("addContactForm");
  const contactsList = document.getElementById("contactsList");
  const emptyState = document.getElementById("emptyState");
  const editModal = document.getElementById("editModal");
  const editContactForm = document.getElementById("editContactForm");
  const closeEditModal = document.getElementById("closeEditModal");
  const cancelEdit = document.getElementById("cancelEdit");
  const deleteModal = document.getElementById("deleteModal");
  const confirmDelete = document.getElementById("confirmDelete");
  const cancelDelete = document.getElementById("cancelDelete");
  const groupTabs = document.querySelectorAll(".group-tab");
  const sortBy = document.getElementById("sortBy");
  const rememberMe = document.getElementById("rememberMe");
  const searchInput = document.getElementById("searchInput");
  const clearSearch = document.getElementById("clearSearch");

  // Переменные состояния
  const host = "http://localhost:3000";
  const getContacts = async (userId) => {
    const contacts = await fetch(host + "/contacts?userId=" + userId, {
      method: "GET",
    });
    const data = await contacts.json();
    return data;
  };
  let contacts = JSON.parse(localStorage.getItem("contacts")) || [];
  let contactToDelete = null;
  let currentGroupFilter = "all";
  let currentSortMethod = "name";
  let currentSearchQuery = "";

  getContacts(1);

  // Проверка сохраненных учетных данных
  checkAuth();

  const deleteContact = async (id) => {
    const response = await fetch(host + "/contacts?id=" + id, {
      method: "DELETE",
    });
    const data = await response.json();
    if (!response.ok) {
      alert("Something went wrong!");
    }
    renderContacts();
    return data;
  };

  // События авторизации
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    // Простая проверка (в реальном приложении нужно проверять на сервере)
    if (username && password) {
      if (rememberMe.checked) {
        localStorage.setItem(
          "rememberedUser",
          JSON.stringify({
            username: username,
            remember: true,
          })
        );
      } else {
        localStorage.removeItem("rememberedUser");
      }

      // Сохраняем информацию о входе в sessionStorage
      sessionStorage.setItem("isAuthenticated", "true");

      // Показываем основное приложение
      authSection.style.display = "none";
      appSection.classList.remove("hidden");

      // Инициализация приложения
      renderContacts();
    } else {
      alert("Пожалуйста, введите имя пользователя и пароль");
    }
  });

  const clearInputs = () => {
    document.getElementById("lastName").value = "";
    document.getElementById("firstName").value = "";
    document.getElementById("middleName").value = "";
    document.getElementById("phone").value = "";
    document.getElementById("email").value = "";
    document.getElementById("address").value = "";
  };

  logoutBtn.addEventListener("click", function () {
    // Удаляем информацию о входе
    sessionStorage.removeItem("isAuthenticated");
    localStorage.removeItem("rememberedUser");

    // Показываем форму авторизации
    authSection.style.display = "flex";
    appSection.classList.add("hidden");
  });

  // Проверка авторизации
  function checkAuth() {
    const isAuthenticated = sessionStorage.getItem("isAuthenticated");
    const rememberedUser = JSON.parse(localStorage.getItem("rememberedUser"));

    if (isAuthenticated || rememberedUser) {
      if (rememberedUser) {
        document.getElementById("username").value = rememberedUser.username;
        rememberMe.checked = true;
      }

      authSection.style.display = "none";
      appSection.classList.remove("hidden");
      renderContacts();
    } else {
      authSection.style.display = "flex";
      appSection.classList.add("hidden");
    }
  }

  const putContacts = async (contacts) => {
    const resp = await fetch(host + "/contacts?userId=" + 1, {
      method: "POST",
      body: JSON.stringify(contacts),
    });
    if (!resp.ok) {
      console.error("ERROR");
    }

    saveAndRender();
    clearInputs();
  };

  // События форм
  addContactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const lastName = document.getElementById("lastName").value.trim();
    const firstName = document.getElementById("firstName").value.trim();
    const middleName = document.getElementById("middleName").value.trim();
    const groupItem = document.getElementById("group").value;
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim();
    const address = document.getElementById("address").value.trim();
    const currentUserId = 1;

    const newContact = {
      id: Date.now().toString(),
      lastName,
      firstName,
      middleName: middleName || null,
      groupItem,
      phone,
      email: email || null,
      address: address || null,
      fullName: `${lastName} ${firstName} ${middleName || ""}`.trim(),
      userId: currentUserId,
    };

    putContacts(newContact);
    renderContacts();
    clearInputs();

    const deleteContactEl = document.querySelectorAll(".delete-contact");
    deleteContactEl.forEach((button) => {
      console.log(button);
      console.log(button.dataset.id);
    });
  });

  editContactForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const id = document.getElementById("editId").value;
    const lastName = document.getElementById("editLastName").value.trim();
    const firstName = document.getElementById("editFirstName").value.trim();
    const middleName = document.getElementById("editMiddleName").value.trim();
    const group = document.getElementById("editGroup").value;
    const phone = document.getElementById("editPhone").value.trim();
    const email = document.getElementById("editEmail").value.trim();
    const address = document.getElementById("editAddress").value.trim();

    const contactIndex = contacts.findIndex((c) => c.id === id);
    if (contactIndex !== -1) {
      contacts[contactIndex] = {
        ...contacts[contactIndex],
        lastName,
        firstName,
        middleName: middleName || null,
        group,
        phone,
        email: email || null,
        address: address || null,
        fullName: `${lastName} ${firstName} ${middleName || ""}`.trim(),
      };

      saveAndRender();
      toggleModal(editModal);
    }
  });

  // Модальные окна
  closeEditModal.addEventListener("click", () => toggleModal(editModal));
  cancelEdit.addEventListener("click", () => toggleModal(editModal));
  cancelDelete.addEventListener("click", () => toggleModal(deleteModal));

  confirmDelete.addEventListener("click", function () {
    if (contactToDelete) {
      contacts = contacts.filter((c) => c.id !== contactToDelete);
      saveAndRender();
      toggleModal(deleteModal);
      contactToDelete = null;
    }
  });

  // Фильтрация по группам
  groupTabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      groupTabs.forEach((t) => t.classList.remove("active"));
      this.classList.add("active");
      currentGroupFilter = this.getAttribute("data-group");
      renderContacts();
    });
  });

  // Сортировка
  sortBy.addEventListener("change", function () {
    currentSortMethod = this.value;
    saveAndRender();
  });

  // Поиск
  searchInput.addEventListener("input", function () {
    currentSearchQuery = this.value.toLowerCase().trim();

    // Показываем/скрываем кнопку очистки
    if (currentSearchQuery) {
      clearSearch.classList.remove("hidden");
    } else {
      clearSearch.classList.add("hidden");
    }

    renderContacts();
  });

  clearSearch.addEventListener("click", function () {
    searchInput.value = "";
    currentSearchQuery = "";
    clearSearch.classList.add("hidden");
    renderContacts();
    searchInput.focus();
  });

  // Функции
  function saveAndRender() {
    sortContacts();
    renderContacts();
  }

  function sortContacts() {
    contacts.sort((a, b) => {
      if (currentSortMethod === "name") {
        return a.firstName.localeCompare(b.firstName);
      } else if (currentSortMethod === "lastName") {
        return a.lastName.localeCompare(b.lastName);
      } else if (currentSortMethod === "group") {
        return a.group.localeCompare(b.group);
      }
      return 0;
    });
  }

  async function filterContacts() {
    const resp = await fetch(host + "/contacts", {
      method: "GET",
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const filteredContacts = data.contacts;
    if (filteredContacts.length === 0) return null;

    // Фильтрация по группе
    if (currentGroupFilter !== "all") {
      filteredContacts = filteredContacts.filter(
        (c) => c.group === currentGroupFilter
      );
    }

    // Фильтрация по поисковому запросу
    if (currentSearchQuery) {
      filteredContacts = filteredContacts.filter((contact) => {
        // Проверяем все поля контакта на соответствие поисковому запросу
        return (
          (contact.lastName &&
            contact.lastName.toLowerCase().includes(currentSearchQuery)) ||
          (contact.firstName &&
            contact.firstName.toLowerCase().includes(currentSearchQuery)) ||
          (contact.middleName &&
            contact.middleName.toLowerCase().includes(currentSearchQuery)) ||
          (contact.phone &&
            contact.phone.toLowerCase().includes(currentSearchQuery)) ||
          (contact.email &&
            contact.email.toLowerCase().includes(currentSearchQuery)) ||
          (contact.address &&
            contact.address.toLowerCase().includes(currentSearchQuery)) ||
          (contact.group &&
            contact.group.toLowerCase().includes(currentSearchQuery))
        );
      });
    }

    return filteredContacts;
  }

  const addEventListenersForDeleteButton = (deleteContactEl) => {
    deleteContactEl.forEach((item) => {
      item.addEventListener("click", (event) => {
        const contactId = deleteContactEl.dataset.id;
        console.log(contactId);
        if (contactId) {
          deleteContact(contactId);
        } else {
          console.error("Contact ID is missing for this button.");
        }
      });
    });
  };

  async function renderContacts() {
    const filteredContacts = await filterContacts();
    if (!filteredContacts) return null;

    if (filteredContacts.length === 0) {
      emptyState.style.display = "block";
      contactsList.innerHTML = "";
      contactsList.appendChild(emptyState);

      // Изменяем текст пустого состояния в зависимости от наличия поискового запроса
      if (currentSearchQuery) {
        emptyState.innerHTML = `
                      <i class="fas fa-search text-4xl mb-2 text-gray-300"></i>
                      <p>Контакты не найдены</p>
                      <p class="text-sm">Попробуйте изменить поисковый запрос</p>
                  `;
      } else {
        emptyState.innerHTML = `
                      <i class="fas fa-address-book text-4xl mb-2 text-gray-300"></i>
                      <p>Ваша телефонная книжка пуста</p>
                      <p class="text-sm">Добавьте первый контакт с помощью формы выше</p>
                  `;
      }

      return;
    }

    emptyState.style.display = "none";
    contactsList.innerHTML = "";

    if (filteredContacts) {
      filteredContacts.forEach((contact) => {
        const contactElement = document.createElement("div");
        contactElement.className =
          "contact-instance p-4 hover:bg-gray-50 transition duration-150 contact-item";

        // Определяем иконку группы
        let groupIcon, groupText;
        switch (contact.group) {
          case "family":
            groupIcon = "fa-home";
            groupText = "Семья";
            break;
          case "friends":
            groupIcon = "fa-user-friends";
            groupText = "Друзья";
            break;
          case "work":
            groupIcon = "fa-briefcase";
            groupText = "Коллеги";
            break;
          default:
            groupIcon = "fa-ellipsis-h";
            groupText = "Другое";
        }

        contactElement.innerHTML = `
                      <div class="flex justify-between items-start">
                          <div>
                              <div class="flex items-center mb-1">
                                  <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md mr-2">
                                      <i class="fas ${groupIcon} mr-1"></i>${groupText}
                                  </span>
                              </div>
                              <h3 class="font-medium text-gray-900">${
                                contact.lastName
                              } ${contact.firstName} ${
          contact.middleName || ""
        }</h3>
                              <p class="text-sm text-gray-600 mt-1"><i class="fas fa-phone-alt mr-2"></i>${
                                contact.phone
                              }</p>
                              ${
                                contact.email
                                  ? `<p class="text-sm text-gray-600 mt-1"><i class="fas fa-envelope mr-2"></i>${contact.email}</p>`
                                  : ""
                              }
                              ${
                                contact.address
                                  ? `<p class="text-sm text-gray-600 mt-1"><i class="fas fa-map-marker-alt mr-2"></i>${contact.address}</p>`
                                  : ""
                              }
                          </div>
                          <div class="flex space-x-2 contact-actions opacity-0 md:opacity-100">
                              <button class="edit-btn p-2 text-primary-600 hover:text-primary-800 rounded-full hover:bg-primary-50" data-id="${
                                contact.id
                              }">
                                  <i class="fas fa-edit"></i>
                              </button>
                              <button class="delete-btn open-modal-delete-btn p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50" data-id="${
                                contact.id
                              }">
                                  <i class="fas fa-trash-alt"></i>
                              </button>
                          </div>
                      </div>
                      <div class="flex space-x-2 mt-2 md:hidden contact-actions">
                          <button class="edit-btn flex-1 py-1 px-3 bg-primary-50 text-primary-600 rounded-md text-sm" data-id="${
                            contact.id
                          }">
                              <i class="fas fa-edit mr-1"></i> Изменить
                          </button>
                          <button class="delete-btn flex-1 py-1 px-3 bg-red-50 text-red-600 rounded-md text-sm" data-id="${
                            contact.id
                          }">
                              <i class="fas fa-trash-alt mr-1"></i> Удалить
                          </button>
                      </div>
                  `;

        contactsList.appendChild(contactElement);

      });
    }

    // Добавляем обработчики событий для новых кнопок
    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const contactId = this.getAttribute("data-id");
        const contact = contacts.find((c) => c.id === contactId);
        if (contact) {
          document.getElementById("editId").value = contact.id;
          document.getElementById("editLastName").value = contact.lastName;
          document.getElementById("editFirstName").value = contact.firstName;
          document.getElementById("editMiddleName").value =
            contact.middleName || "";
          document.getElementById("editGroup").value = contact.group;
          document.getElementById("editPhone").value = contact.phone;
          document.getElementById("editEmail").value = contact.email || "";
          document.getElementById("editAddress").value = contact.address || "";
          toggleModal(editModal);
        }
      });
    });

    document.querySelectorAll(".open-modal-delete-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const id = btn.dataset.id
        deleteContact(id)
      });
    });
  }

  function toggleModal(modal) {
    modal.classList.toggle("modal-hidden");
    modal.classList.toggle("opacity-0");
    modal.classList.toggle("opacity-100");

    if (!modal.classList.contains("modal-hidden")) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }
});
