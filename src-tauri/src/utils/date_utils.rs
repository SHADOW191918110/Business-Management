use chrono::{DateTime, Utc, Local, TimeZone};
use serde::{Deserialize, Serialize};

/// Format a UTC datetime for display
pub fn format_datetime(dt: DateTime<Utc>) -> String {
    dt.format("%Y-%m-%d %H:%M:%S").to_string()
}

/// Format a UTC datetime to local timezone
pub fn format_local_datetime(dt: DateTime<Utc>) -> String {
    let local_dt: DateTime<Local> = dt.with_timezone(&Local);
    local_dt.format("%Y-%m-%d %H:%M:%S").to_string()
}

/// Parse date string in various formats
pub fn parse_date(date_str: &str) -> Result<DateTime<Utc>, String> {
    // Try ISO 8601 format first
    if let Ok(dt) = DateTime::parse_from_rfc3339(date_str) {
        return Ok(dt.with_timezone(&Utc));
    }
    
    // Try common date formats
    let formats = vec![
        "%Y-%m-%d",
        "%Y-%m-%d %H:%M:%S",
        "%m/%d/%Y",
        "%d/%m/%Y",
        "%Y/%m/%d",
    ];
    
    for format in formats {
        if let Ok(naive_dt) = chrono::NaiveDateTime::parse_from_str(date_str, format) {
            return Ok(Utc.from_utc_datetime(&naive_dt));
        }
        if let Ok(naive_date) = chrono::NaiveDate::parse_from_str(date_str, format) {
            return Ok(Utc.from_utc_datetime(&naive_date.and_hms_opt(0, 0, 0).unwrap()));
        }
    }
    
    Err("Unable to parse date".to_string())
}

/// Get start and end of day for a given date
pub fn get_day_range(date: DateTime<Utc>) -> (DateTime<Utc>, DateTime<Utc>) {
    let start = date.date_naive().and_hms_opt(0, 0, 0).unwrap();
    let end = date.date_naive().and_hms_opt(23, 59, 59).unwrap();
    (
        Utc.from_utc_datetime(&start),
        Utc.from_utc_datetime(&end),
    )
}

/// Get start and end of week for a given date
pub fn get_week_range(date: DateTime<Utc>) -> (DateTime<Utc>, DateTime<Utc>) {
    let weekday = date.weekday().num_days_from_monday() as i64;
    let start_date = date.date_naive() - chrono::Duration::days(weekday);
    let end_date = start_date + chrono::Duration::days(6);
    
    let start = start_date.and_hms_opt(0, 0, 0).unwrap();
    let end = end_date.and_hms_opt(23, 59, 59).unwrap();
    
    (
        Utc.from_utc_datetime(&start),
        Utc.from_utc_datetime(&end),
    )
}

/// Get start and end of month for a given date
pub fn get_month_range(date: DateTime<Utc>) -> (DateTime<Utc>, DateTime<Utc>) {
    let start_date = chrono::NaiveDate::from_ymd_opt(date.year(), date.month(), 1).unwrap();
    let end_date = if date.month() == 12 {
        chrono::NaiveDate::from_ymd_opt(date.year() + 1, 1, 1).unwrap() - chrono::Duration::days(1)
    } else {
        chrono::NaiveDate::from_ymd_opt(date.year(), date.month() + 1, 1).unwrap() - chrono::Duration::days(1)
    };
    
    let start = start_date.and_hms_opt(0, 0, 0).unwrap();
    let end = end_date.and_hms_opt(23, 59, 59).unwrap();
    
    (
        Utc.from_utc_datetime(&start),
        Utc.from_utc_datetime(&end),
    )
}

/// Business hours check
pub fn is_business_hours(dt: DateTime<Utc>, timezone: &chrono_tz::Tz) -> bool {
    let local_dt = dt.with_timezone(timezone);
    let hour = local_dt.hour();
    let weekday = local_dt.weekday();
    
    // Assuming business hours: Monday-Friday 9 AM - 6 PM
    use chrono::Weekday;
    match weekday {
        Weekday::Sat | Weekday::Sun => false,
        _ => hour >= 9 && hour < 18,
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DateRange {
    pub start: DateTime<Utc>,
    pub end: DateTime<Utc>,
}

impl DateRange {
    pub fn new(start: DateTime<Utc>, end: DateTime<Utc>) -> Self {
        Self { start, end }
    }
    
    pub fn today() -> Self {
        let now = Utc::now();
        let (start, end) = get_day_range(now);
        Self::new(start, end)
    }
    
    pub fn this_week() -> Self {
        let now = Utc::now();
        let (start, end) = get_week_range(now);
        Self::new(start, end)
    }
    
    pub fn this_month() -> Self {
        let now = Utc::now();
        let (start, end) = get_month_range(now);
        Self::new(start, end)
    }
    
    pub fn last_n_days(n: i64) -> Self {
        let end = Utc::now();
        let start = end - chrono::Duration::days(n);
        Self::new(start, end)
    }
}