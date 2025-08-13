document.addEventListener("DOMContentLoaded", () => {
  const pageViews = document.querySelectorAll(".page__view");
  const tabButtons = document.querySelectorAll(".tabbar__item");
  const fabGift = document.getElementById("fabGift");
  const topTabs = document.querySelectorAll(".tab");
  const soundToggle = document.getElementById("soundToggle");
  const soundLabel = document.getElementById("soundLabel");
  const balanceAmount = document.getElementById("balanceAmount");

  let balance = 0;

  // Format balance in k notation
  const formatBalance = (val) => {
    if (val >= 1000) {
      return (val / 1000).toFixed(val % 1000 === 0 ? 0 : 1) + "k";
    }
    return val;
  };

  // Switch page
  const showPage = (id) => {
    pageViews.forEach((view) =>
      view.classList.toggle("page__view--active", view.id === id)
    );
  };

  // Bottom navigation
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const page = btn.dataset.page;
      if (page === "home") showPage("feedPage");
      if (page === "gifts") showPage("giftsPage");
      if (page === "wallet") showPage("walletPage");
      if (page === "profile") showPage("profilePage");
    });
  });

  // Top tabs (Following, Popular, Nearby, New)
  topTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      topTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      // You can swap feed content here if needed
    });
  });

  // FAB honeypot button
  fabGift.addEventListener("click", () => {
    showPage("giftsPage");
  });

  // Sound toggle
  soundToggle.addEventListener("click", () => {
    const isOn = soundToggle.getAttribute("aria-pressed") === "true";
    soundToggle.setAttribute("aria-pressed", String(!isOn));
    soundLabel.textContent = isOn ? "Off" : "On";
  });

  // Dev buttons for wallet
  const add100 = document.getElementById("devAdd100");
  const resetBal = document.getElementById("resetBalance");

  if (add100) {
    add100.addEventListener("click", () => {
      balance += 100;
      balanceAmount.textContent = formatBalance(balance);
    });
  }

  if (resetBal) {
    resetBal.addEventListener("click", () => {
      balance = 0;
      balanceAmount.textContent = balance;
    });
  }
});