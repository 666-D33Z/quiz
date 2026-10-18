const questionBank = {
    easy: [
        // Multiple Choice Trivia
        { type: "mc", category: "Geography", question: "What is the capital city of Australia?", options: ["Sydney", "Melbourne", "Canberra", "Perth"], answer: "Canberra" },
        { type: "mc", category: "General", question: "How many legs does a spider have?", options: ["6", "8", "10", "12"], answer: "8" },
        { type: "mc", category: "Animals", question: "What is a baby kangaroo called?", options: ["Cub", "Joey", "Pup", "Calf"], answer: "Joey" },
        { type: "mc", category: "Geography", question: "Which US state is the largest by area?", options: ["Texas", "California", "Alaska", "Montana"], answer: "Alaska" },
        { type: "mc", category: "Sports", question: "How many players are on the pitch for one football team?", options: ["10", "11", "12", "9"], answer: "11" },
        
        // List Challenges
        { type: "list", category: "Geography", question: "Name as many English counties starting with 'B' as you can (Max 4)", maxPoints: 4, answer: "Bedfordshire, Berkshire, Buckinghamshire, Bristol" },
        { type: "list", category: "Geography", question: "Name 4 European countries starting with 'S'", maxPoints: 4, answer: "Spain, Sweden, Switzerland, Slovakia (or Serbia, Slovenia)" }
    ],
    medium: [
        // Multiple Choice Trivia
        { type: "mc", category: "History", question: "In what year did the Titanic sink?", options: ["1910", "1912", "1915", "1920"], answer: "1912" },
        { type: "mc", category: "Science", question: "What planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], answer: "Mars" },
        { type: "mc", category: "Sports (NFL)", question: "Which NFL team won the Super Bowl in 2024?", options: ["San Francisco 49ers", "Kansas City Chiefs", "Philadelphia Eagles", "Dallas Cowboys"], answer: "Kansas City Chiefs" },
        { type: "mc", category: "Geography", question: "Which of these is a city in Scotland?", options: ["Aberdeen", "Newcastle", "Leeds", "Sheffield"], answer: "Aberdeen" },
        
        // List Challenges
        { type: "list", category: "Football", question: "Name English Premier League teams (Can you name 5 quickly?)", maxPoints: 5, answer: "Arsenal, Aston Villa, Chelsea, Liverpool, Man City, Man Utd, etc." },
        { type: "list", category: "Geography", question: "Name US States starting with 'M' (There are 8 total!)", maxPoints: 8, answer: "Maine, Maryland, Massachusetts, Michigan, Minnesota, Mississippi, Missouri, Montana" }
    ],
    hard: [
        // Multiple Choice Trivia
        { type: "mc", category: "Geography", question: "What is the capital of Kazakhstan?", options: ["Almaty", "Astana", "Tashkent", "Bishkek"], answer: "Astana" },
        { type: "mc", category: "Sports (NBA)", question: "Which NBA team has won the most championships (tied)?", options: ["Chicago Bulls", "Boston Celtics & LA Lakers", "Golden State Warriors", "Miami Heat"], answer: "Boston Celtics & LA Lakers" },
        { type: "mc", category: "History", question: "Who was the first Emperor of Rome?", options: ["Julius Caesar", "Augustus", "Nero", "Constantine"], answer: "Augustus" },
        
        // List Challenges
        { type: "list", category: "Geography", question: "Name landlocked countries in Africa (Name up to 5)", maxPoints: 5, answer: "Botswana, Chad, Mali, Niger, Rwanda, Uganda, Zambia, Zimbabwe" },
        { type: "list", category: "Football", question: "Name Scottish Premiership teams (Total of 12)", maxPoints: 6, answer: "Celtic, Rangers, Hearts, Hibernian, Aberdeen, St Mirren, etc." }
    ]
};
