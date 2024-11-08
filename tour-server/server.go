package main

import (
	"net/http"
	"time"

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
		}}
		return c.JSON(http.StatusOK, tours)
	})
	e.Logger.Fatal(e.Start("127.0.0.1:1323"))

}
