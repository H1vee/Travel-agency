# Tour Server API

A REST API backend service for a tour booking system built with Go, Echo framework, and PostgreSQL. The system manages tours, bookings, seat availability, and search functionality.

## 🚀 Features

- **Tour Management**: Full CRUD operations for tours with detailed information
- **Booking System**: Complete booking workflow with seat management
- **Search & Filtering**: Advanced search capabilities with multiple filters
- **Image Management**: Tour card images and gallery management
- **Seat Availability**: Real-time seat tracking and availability
- **Location Management**: Geographic location handling for tours

## 🛠 Tech Stack
**Backend:** 
- **Language**: Go 1.19+
- **Web Framework**: Echo v4
- **Database**: PostgreSQL
- **ORM**: GORM
- **Database Driver**: lib/pq
**Frontend**
-**React 18** - the main framework
-**TypeScript** - typing for reliable code
-**React Router DOM** - routing
-**HeroUI (NextUI)** - UI components
-**TanStack Query** - server state management
-**SCSS** - styling
-**Swiper.js** - image carousel
  
## 📁 Project Structure

```
tour-server/
├── bookings/           # Booking management
│   ├── api/           # Booking endpoints
│   ├── dto/           # Data transfer objects
│   └── models/        # Booking data models
├── database/          # Database connection and configuration
├── location/          # Location management
│   └── models/        # Location models
├── search/            # Search functionality
│   ├── api/           # Search endpoints
│   ├── dto/           # Search DTOs
│   └── models/        # Search models
├── status/            # Status management
│   └── models/        # Status models
├── tour/              # Core tour functionality
│   ├── api/           # Tour endpoints
│   ├── dto/           # Tour DTOs
│   └── models/        # Tour models
├── tourcardimage/     # Tour card image management
├── tourdate/          # Tour date management
├── tourgalleryimage/  # Tour gallery management
├── tourseats/         # Seat availability management
└── server.go          # Main server file
```

## 🔧 Installation & Setup

### Prerequisites

- Go 1.19 or higher
- PostgreSQL 12+
- Git

### Database Setup

1. Install PostgreSQL and create a database:
```sql
CREATE DATABASE tour_booking;
```

2. Update database credentials in `database/connection.go`:
```go
const (
    host     = "localhost"
    port     = 5432
    user     = "your_username"
    password = "your_password"
    dbname   = "tour_booking"
)
```

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd tour-server
```

2. Initialize Go modules:
```bash
go mod init tour-server
go mod tidy
```

3. Install dependencies:
```bash
go get github.com/labstack/echo/v4
go get github.com/labstack/echo/v4/middleware
go get gorm.io/gorm
go get gorm.io/driver/postgres
go get github.com/lib/pq
```

4. Run the server:
```bash
go run server.go
```

The server will start on `http://127.0.0.1:1323`

## 📋 API Endpoints

### Tour Management
- `GET /` - Health check
- `GET /tours` - Get all tours
- `GET /tours/:id` - Get tour by ID
- `GET /cards` - Get tours for card display
- `GET /tourswiper` - Get tours for swiper/carousel
- `GET /tours-search-by-ids?ids=1,2,3` - Get specific tours by IDs
- `GET /tour-carousel/:id` - Get tour gallery images

### Booking System
- `POST /tour/bookings` - Create a new booking

**Booking Request Body:**
```json
{
  "tour_date_id": 1,
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "customer_phone": "+1234567890",
  "seats": 2,
  "total_price": 299.99
}
```

### Search & Filtering
- `GET /search` - Search tours with filters

**Search Parameters:**
- `title` - Search by tour title (case insensitive)
- `duration` - Filter by duration in days
- `minPrice` & `maxPrice` - Price range filter
- `minRating` & `maxRating` - Rating range filter (0-5)
- `region` - Filter by region IDs (comma-separated)

**Example:**
```
GET /search?title=paris&minPrice=100&maxPrice=500&minRating=4.0
```

### Seat Management
- `GET /tour-seats/:id` - Get seat availability for a tour

### Image Management
- `GET /tourimage` - Get all tour card images
- `GET /static/*` - Static file serving

## 🗄️ Database Schema

The system uses the following main tables:

- **tours** - Core tour information
- **tour_dates** - Tour scheduling and dates
- **tour_seats** - Seat availability tracking
- **bookings** - Customer bookings
- **locations** - Geographic locations
- **statuses** - Tour status management
- **tour_card_images** - Tour card images
- **tour_gallery_images** - Tour gallery images

## 🔍 Key Features Explained

### Booking System
The booking system handles seat reservation with real-time availability checking. When a booking is created, the system:
1. Validates the request data
2. Checks available seats for the tour date
3. Creates the booking with "pending" status
4. Returns confirmation

### Search Functionality
Advanced search with multiple filters:
- Text search in tour titles (case insensitive)
- Price range filtering
- Rating range filtering (0-5 scale)
- Duration filtering
- Region-based filtering for departure/arrival locations

### Seat Management
Real-time seat tracking system that:
- Tracks available seats per tour date
- Prevents overbooking
- Provides seat availability information

## 🛡️ Error Handling

The API includes comprehensive error handling:
- Database connection validation
- Input data validation
- Proper HTTP status codes
- Detailed error messages for debugging

## 🚦 CORS Support

CORS middleware is enabled to allow cross-origin requests from frontend applications.

## 📝 Logging

The application includes detailed logging for:
- API requests and responses
- Database queries (debug mode)
- Error tracking
- Search parameters and results

## 🔄 Development

### Running in Debug Mode
The application runs GORM in debug mode, which logs all SQL queries for development purposes.

### Static Files
Static files are served from the `/static` directory and accessible via `/static/*` endpoints.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions, please open an issue in the repository.


