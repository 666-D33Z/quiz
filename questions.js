const questionBank = {
    easy: [
        { type: "mc", category: "Geography", question: "What is the capital city of Australia?", options: ["Sydney", "Melbourne", "Canberra", "Perth"], answer: "Canberra" },
        { type: "mc", category: "General", question: "How many legs does a spider have?", options: ["6", "8", "10", "12"], answer: "8" },
        { type: "mc", category: "Geography", question: "Which US state is the largest by area?", options: ["Texas", "California", "Alaska", "Montana"], answer: "Alaska" },
        { type: "mc", category: "Sports", question: "How many players are on the pitch for one football team?", options: ["10", "11", "12", "9"], answer: "11" },
        { type: "list", category: "Geography", question: "Name English counties starting with 'B' (Max 4)", maxPoints: 4, answer: "Bedfordshire, Berkshire, Buckinghamshire, Bristol" },
        { type: "list", category: "Geography", question: "Name European countries starting with 'S'", maxPoints: 4, answer: "Spain, Sweden, Switzerland, Slovakia, Serbia, Slovenia" }
    ],
    medium: [
        { type: "mc", category: "History", question: "In what year did the Titanic sink?", options: ["1910", "1912", "1915", "1920"], answer: "1912" },
        { type: "mc", category: "Science", question: "What planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], answer: "Mars" },
        { type: "mc", category: "Football", question: "Which team won the 2023/24 Premier League?", options: ["Arsenal", "Man City", "Liverpool", "Chelsea"], answer: "Man City" },
        { type: "list", category: "Football", question: "Name Scottish Premiership teams (Can you name 5?)", maxPoints: 5, answer: "Celtic, Rangers, Hearts, Hibernian, Aberdeen, St Mirren, Motherwell, etc." }
    ],
    hard: [
        { type: "mc", category: "Geography", question: "What is the capital of Kazakhstan?", options: ["Almaty", "Astana", "Tashkent", "Bishkek"], answer: "Astana" },
        { type: "list", category: "Geography", question: "Name US States starting with 'M' (There are 8 total!)", maxPoints: 8, answer: "Maine, Maryland, Massachusetts, Michigan, Minnesota, Mississippi, Missouri, Montana" }
    ]
};
