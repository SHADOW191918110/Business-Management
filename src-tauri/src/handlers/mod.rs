// Re-export all handlers
pub mod product_handlers;
pub mod customer_handlers;
pub mod sale_handlers;
pub mod inventory_handlers;
pub mod user_handlers;
pub mod report_handlers;
pub mod system_handlers;

pub use product_handlers::*;
pub use customer_handlers::*;
pub use sale_handlers::*;
pub use inventory_handlers::*;
pub use user_handlers::*;
pub use report_handlers::*;
pub use system_handlers::*;