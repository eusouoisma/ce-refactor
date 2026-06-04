// Dependency injection container — wires repositories and services together.
const { pool } = require('./shared/db');
const { signToken } = require('./http/middleware/auth');

// Repositories
const { TourRepository }            = require('./infrastructure/repositories/TourRepository');
const { UserRepository }            = require('./infrastructure/repositories/UserRepository');
const { CustomerRepository }        = require('./infrastructure/repositories/CustomerRepository');
const { ComissionRepository }       = require('./infrastructure/repositories/ComissionRepository');
const { ProductRepository }         = require('./infrastructure/repositories/ProductRepository');
const { DayOrderRepository }        = require('./infrastructure/repositories/DayOrderRepository');
const { ChangeRequestRepository }   = require('./infrastructure/repositories/ChangeRequestRepository');
const { NumberOfGroupsRepository }  = require('./infrastructure/repositories/NumberOfGroupsRepository');
const { QuickSearchRepository }     = require('./infrastructure/repositories/QuickSearchRepository');
const { ReportRepository }          = require('./infrastructure/repositories/ReportRepository');
const { SettingsRepository }        = require('./infrastructure/repositories/SettingsRepository');
const { TourEditHistoryRepository } = require('./infrastructure/repositories/TourEditHistoryRepository');

// Application services
const { TourService }            = require('./application/TourService');
const { UserService }            = require('./application/UserService');
const { CustomerService }        = require('./application/CustomerService');
const { ComissionService }       = require('./application/ComissionService');
const { ProductService }         = require('./application/ProductService');
const { DayOrderService }        = require('./application/DayOrderService');
const { ChangeRequestService }   = require('./application/ChangeRequestService');
const { NumberOfGroupsService }  = require('./application/NumberOfGroupsService');
const { QuickSearchService }     = require('./application/QuickSearchService');
const { ReportService }          = require('./application/ReportService');
const { SettingsService }        = require('./application/SettingsService');
const { TourEditHistoryService } = require('./application/TourEditHistoryService');

// Instantiate repositories
const tourRepo             = new TourRepository(pool);
const userRepo             = new UserRepository(pool);
const customerRepo         = new CustomerRepository(pool);
const comissionRepo        = new ComissionRepository(pool);
const productRepo          = new ProductRepository(pool);
const dayOrderRepo         = new DayOrderRepository(pool);
const changeRequestRepo    = new ChangeRequestRepository(pool);
const numberOfGroupsRepo   = new NumberOfGroupsRepository(pool);
const quickSearchRepo      = new QuickSearchRepository(pool);
const reportRepo           = new ReportRepository(pool);
const settingsRepo         = new SettingsRepository(pool);
const tourEditHistoryRepo  = new TourEditHistoryRepository(pool);

// Instantiate services
const tourEditHistoryService = new TourEditHistoryService({ tourEditHistoryRepo });
const tourService = new TourService({
  pool, tourRepo, settingsRepo, dayOrderRepo, comissionRepo, changeRequestRepo, customerRepo,
  tourEditHistoryService,
});
const userService           = new UserService({ userRepo, signToken });
const customerService       = new CustomerService({ pool, customerRepo });
const comissionService      = new ComissionService({ comissionRepo });
const productService        = new ProductService({ pool, productRepo });
const dayOrderService       = new DayOrderService({ pool, dayOrderRepo });
const changeRequestService  = new ChangeRequestService({ changeRequestRepo });
const numberOfGroupsService = new NumberOfGroupsService({ pool, numberOfGroupsRepo });
const quickSearchService    = new QuickSearchService({ quickSearchRepo });
const reportService         = new ReportService({ reportRepo });
const settingsService       = new SettingsService({ settingsRepo });

module.exports = {
  tourService, userService, customerService, comissionService, productService,
  dayOrderService, changeRequestService, numberOfGroupsService, quickSearchService,
  reportService, settingsService,
};
