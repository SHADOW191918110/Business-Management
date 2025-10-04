use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use rust_decimal::Decimal;

#[derive(Debug, Serialize, Deserialize)]
struct GstCalculation {
    base_amount: Decimal,
    gst_rate: Decimal,
    cgst: Decimal,
    sgst: Decimal,
    total: Decimal,
}

async fn calculate_gst(info: web::Query<GstCalculation>) -> impl Responder {
    let gst_amount = info.base_amount * info.gst_rate / Decimal::from(100);
    let cgst = gst_amount / Decimal::from(2);
    let sgst = gst_amount / Decimal::from(2);
    let total = info.base_amount + gst_amount;

    HttpResponse::Ok().json(GstCalculation {
        base_amount: info.base_amount,
        gst_rate: info.gst_rate,
        cgst,
        sgst,
        total,
    })
}
