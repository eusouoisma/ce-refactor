const formatMoney = (value) =>
  isNaN(value) || value == 0
    ? ""
    : parseFloat(value)
        .toFixed(2)
        ?.toString()
        .replace(".", ",")
        .replace(/\B(?=(\d{3})+(?!\d))/g, ".");

export { formatMoney };
