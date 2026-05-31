class QuickSearchService {
  constructor({ quickSearchRepo }) {
    this.quickSearchRepo = quickSearchRepo;
  }

  async search(reserva, cliente) {
    const [reservas, clientes] = await Promise.all([
      reserva ? this.quickSearchRepo.findOrderRefSuggestions(reserva) : Promise.resolve([]),
      cliente ? this.quickSearchRepo.findClientSuggestions(cliente) : Promise.resolve([]),
    ]);
    return { reservas, clientes };
  }

  async searchTours(reserva, cliente) {
    const tours = await this.quickSearchRepo.findTours({ orderRef: reserva, client: cliente });
    return { tours };
  }
}

module.exports = { QuickSearchService };
