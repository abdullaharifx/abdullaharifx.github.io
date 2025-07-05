'use strict';



// element toggle function
const elementToggleFunc = function (elem) { elem.classList.toggle("active"); }



// sidebar variables
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

// sidebar toggle functionality for mobile
sidebarBtn.addEventListener("click", function () { elementToggleFunc(sidebar); });



// testimonials variables
const testimonialsItem = document.querySelectorAll("[data-testimonials-item]");
const modalContainer = document.querySelector("[data-modal-container]");
const modalCloseBtn = document.querySelector("[data-modal-close-btn]");
const overlay = document.querySelector("[data-overlay]");

// modal variable
const modalImg = document.querySelector("[data-modal-img]");
const modalTitle = document.querySelector("[data-modal-title]");
const modalText = document.querySelector("[data-modal-text]");

// modal toggle function
const testimonialsModalFunc = function () {
  modalContainer.classList.toggle("active");
  overlay.classList.toggle("active");
}

// add click event to all modal items
for (let i = 0; i < testimonialsItem.length; i++) {

  testimonialsItem[i].addEventListener("click", function () {

    modalImg.src = this.querySelector("[data-testimonials-avatar]").src;
    modalImg.alt = this.querySelector("[data-testimonials-avatar]").alt;
    modalTitle.innerHTML = this.querySelector("[data-testimonials-title]").innerHTML;
    modalText.innerHTML = this.querySelector("[data-testimonials-text]").innerHTML;

    testimonialsModalFunc();

  });

}

// add click event to modal close button
modalCloseBtn.addEventListener("click", testimonialsModalFunc);
overlay.addEventListener("click", testimonialsModalFunc);



// custom select variables
const select = document.querySelector("[data-select]");
const selectItems = document.querySelectorAll("[data-select-item]");
const selectValue = document.querySelector("[data-select-value]");
const filterBtn = document.querySelectorAll("[data-filter-btn]");

select.addEventListener("click", function () { elementToggleFunc(this); });

// add event in all select items
for (let i = 0; i < selectItems.length; i++) {
  selectItems[i].addEventListener("click", function () {

    let selectedValue = this.innerText.toLowerCase();
    selectValue.innerText = this.innerText;
    elementToggleFunc(select);
    filterFunc(selectedValue);

  });
}

// filter variables
const filterItems = document.querySelectorAll("[data-filter-item]");

const filterFunc = function (selectedValue) {

  for (let i = 0; i < filterItems.length; i++) {

    if (selectedValue === "all") {
      filterItems[i].classList.add("active");
    } else if (selectedValue === filterItems[i].dataset.category.toLowerCase()) {
      filterItems[i].classList.add("active");
    } else {
      filterItems[i].classList.remove("active");
    }

  }

}

// add event in all filter button items for large screen
let lastClickedBtn = filterBtn[0];

for (let i = 0; i < filterBtn.length; i++) {

  filterBtn[i].addEventListener("click", function () {

    let selectedValue = this.innerText.toLowerCase();
    selectValue.innerText = this.innerText;
    filterFunc(selectedValue);

    lastClickedBtn.classList.remove("active");
    this.classList.add("active");
    lastClickedBtn = this;

  });

}



// contact form variables
const form = document.querySelector("[data-form]");
const formInputs = document.querySelectorAll("[data-form-input]");
const formBtn = document.querySelector("[data-form-btn]");

// add event to all form input field
for (let i = 0; i < formInputs.length; i++) {
  formInputs[i].addEventListener("input", function () {

    // check form validation
    if (form.checkValidity()) {
      formBtn.removeAttribute("disabled");
    } else {
      formBtn.setAttribute("disabled", "");
    }

  });
}



// page navigation variables
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

// add event to all nav link
for (let i = 0; i < navigationLinks.length; i++) {
  navigationLinks[i].addEventListener("click", function () {

    for (let i = 0; i < pages.length; i++) {
      if (this.innerHTML.toLowerCase() === pages[i].dataset.page) {
        pages[i].classList.add("active");
        navigationLinks[i].classList.add("active");
        window.scrollTo(0, 0);
      } else {
        pages[i].classList.remove("active");
        navigationLinks[i].classList.remove("active");
      }
    }

  });
}

// Initialize filter to show all projects on page load
window.addEventListener('DOMContentLoaded', function() {
  // Set the select value to "All" initially
  const selectValue = document.querySelector("[data-select-value]");
  if (selectValue) {
    selectValue.innerText = "All";
  }
  
  // Show all projects initially
  filterFunc("all");
});


// Project Modal functionality
const projectCards = document.querySelectorAll("[data-project-modal]");
const projectModalContainer = document.querySelector("[data-project-modal-container]");
const projectModalCloseBtn = document.querySelector("[data-project-modal-close]");
const projectOverlay = document.querySelector("[data-project-overlay]");

// Modal content elements
const projectModalTitle = document.querySelector("[data-project-modal-title]");
const projectModalDescription = document.querySelector("[data-project-modal-description]");
const projectModalTechnologies = document.querySelector("[data-project-modal-technologies]");
const projectModalGithub = document.querySelector("[data-project-modal-github]");
const projectModalDemo = document.querySelector("[data-project-modal-demo]");
const projectModalReport = document.querySelector("[data-project-modal-report]");

// Project modal toggle function
const projectModalFunc = function () {
  projectModalContainer.classList.toggle("active");
}

// Add click event to all project cards
for (let i = 0; i < projectCards.length; i++) {
  projectCards[i].addEventListener("click", function () {
    // Get project data from data attributes
    const title = this.dataset.title;
    const description = this.dataset.description;
    const technologies = this.dataset.technologies;
    const github = this.dataset.github;
    const demo = this.dataset.demo;
    const report = this.dataset.report;

    // Populate modal content
    projectModalTitle.textContent = title;
    projectModalDescription.textContent = description;

    // Create technology tags
    if (technologies) {
      const techArray = technologies.split(',');
      projectModalTechnologies.innerHTML = '';
      techArray.forEach(tech => {
        const techTag = document.createElement('span');
        techTag.className = 'tech-tag';
        techTag.textContent = tech.trim();
        projectModalTechnologies.appendChild(techTag);
      });
    }

    // Set button links and visibility
    if (github) {
      projectModalGithub.href = github;
      projectModalGithub.style.display = 'inline-flex';
    } else {
      projectModalGithub.style.display = 'none';
    }

    if (demo) {
      projectModalDemo.href = demo;
      projectModalDemo.style.display = 'inline-flex';
    } else {
      projectModalDemo.style.display = 'none';
    }

    if (report) {
      projectModalReport.href = report;
      projectModalReport.style.display = 'inline-flex';
    } else {
      projectModalReport.style.display = 'none';
    }

    // Show modal
    projectModalFunc();
  });
}

// Add click event to modal close button and overlay
if (projectModalCloseBtn) {
  projectModalCloseBtn.addEventListener("click", projectModalFunc);
}

if (projectOverlay) {
  projectOverlay.addEventListener("click", projectModalFunc);
}

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape' && projectModalContainer.classList.contains('active')) {
    projectModalFunc();
  }
});

// Prevent modal from closing when clicking inside the modal content
const projectModal = document.querySelector(".project-modal");
if (projectModal) {
  projectModal.addEventListener("click", function(event) {
    event.stopPropagation();
  });
}