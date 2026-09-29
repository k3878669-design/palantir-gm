const modal = document.getElementById("modal");
const selectedCampaign = document.getElementById("selectedCampaign");
const closeModal = document.getElementById("closeModal");
const newCampaign = document.getElementById("newCampaign");

document.querySelectorAll(".campaign-card").forEach((card) => {
  card.addEventListener("click", () => {
    selectedCampaign.textContent = card.dataset.campaign;
    modal.classList.remove("hidden");
  });
});

closeModal.addEventListener("click", () => {
  modal.classList.add("hidden");
});

modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    modal.classList.add("hidden");
  }
});

newCampaign.addEventListener("click", () => {
  alert("Criador de campanhas: EM CONSTRUÇÃO.");
});
