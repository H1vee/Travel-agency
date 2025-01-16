package main

import (
	"net/http"
	"time"
	"tour-server/database"

	"github.com/labstack/echo/v4"
)

type Tour struct {
	Title        string    `json:"title"`
	Description  string    `json:"description"`
	CallToAction string    `json:"callToAction"`
	From         string    `json:"from"`
	To           string    `json:"to"`
	DateFrom     time.Time `json:"dateFrom"`
	DateTo       time.Time `json:"dateTo"`
	ImageSrc     string    `json:"imageSrc"`
}

func main() {

	database.InitDB()

	e := echo.New()
	e.Static("/static", "static")
	e.GET("/", func(c echo.Context) error {
		return c.String(http.StatusOK, "Hello, World!")
	})
	e.GET("/tours", func(c echo.Context) error {
		tours := []Tour{{
			Title:        "Тур по Тайваню: Відкрийте Магію Острова!",
			Description:  "Відвідайте сучасні мегаполіси, зануртеся в атмосферу стародавніх храмів, досліджуйте чарівні чайні плантації та насолодіться величними гірськими краєвидами.",
			CallToAction: "ЗАБРОНЮВАТИ ЗАРАЗ",
			From:         "Київ",
			To:           "Карпати",
			DateFrom:     time.Now(),
			DateTo:       time.Now().Add(time.Hour * 24 * 7),
			ImageSrc:     "/static/taiwan.jpg",
		}, {
			Title:        "Тур до Єгипту: Доторкніться до Вічності!",
			Description:  "Запрошуємо вас у захоплюючу подорож до Єгипту, країни, де історія оживає на кожному кроці. Відкрийте для себе величні піраміди, таємничий Сфінкс і скарби фараонів. ",
			CallToAction: "ЗАБРОНЮВАТИ ЗАРАЗ",
			From:         "Чернівці",
			To:           "Курськ",
			DateFrom:     time.Now(),
			DateTo:       time.Now().Add(time.Hour * 24 * 7),
			ImageSrc:     "/static/egypt.png",
		}, {
			Title:        "Тур до Бостона: Відчуйте Дух Американської Історії!",
			Description:  "Вирушайте в захоплюючу подорож до Бостона — колиски американської революції та одного з найстаріших міст США.",
			CallToAction: "ЗАБРОНЮВАТИ ЗАРАЗ",
			From:         "Київ",
			To:           "Карпати",
			DateFrom:     time.Now(),
			DateTo:       time.Now().Add(time.Hour * 24 * 7),
			ImageSrc:     "/static/boston.jpg",
		}, {
			Title:        "Тур на Мальдіви: Райське Задоволення на Островах!",
			Description:  "Пориньте у світ білосніжних пляжів, бірюзових лагун та незабутнього підводного світу. Мальдіви — ідеальне місце для відпочинку та романтики, де кожен день сповнений гармонії та краси.",
			CallToAction: "ЗАБРОНЮВАТИ ЗАРАЗ",
			From:         "Київ",
			To:           "Карпати",
			DateFrom:     time.Now(),
			DateTo:       time.Now().Add(time.Hour * 24 * 7),
			ImageSrc:     "/static/maldives.jpg",
		}, {
			Title:        "Магія Сходу: Тур у Дубай",
			Description:  "Сучасний мегаполіс, пустельні дюни, розкішні готелі та вражаюча архітектура. Відкрийте для себе казковий Дубай!",
			CallToAction: "ЗАБРОНЮВАТИ ЗАРАЗ",
			From:         "Харків",
			To:           "Дубай",
			DateFrom:     time.Now().Add(time.Hour * 24 * 7),
			DateTo:       time.Now().Add(time.Hour * 24 * 14),
			ImageSrc:     "/static/dubai.jpg",
		},
			{
				Title:        "Італійський Роман: Від Риму до Венеції",
				Description:  "Побачте Колізей, відчуйте шарм Флоренції та насолодіться прогулянкою на гондолі в Венеції. Італія чекає на вас!",
				CallToAction: "ЗАБРОНЮВАТИ ЗАРАЗ",
				From:         "Київ",
				To:           "Італія",
				DateFrom:     time.Now().Add(time.Hour * 24 * 14),
				DateTo:       time.Now().Add(time.Hour * 24 * 21),
				ImageSrc:     "/static/italy.jpg",
			},
		}
		return c.JSON(http.StatusOK, tours)
	})
	e.Logger.Fatal(e.Start("127.0.0.1:1323"))

}
