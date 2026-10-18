// Master Data for Dynamic List Challenges
const listMasterData = {
    englishCounties: {
        category: "Geography",
        promptLetter: ["B", "S", "W", "C", "N", "L", "Y"],
        // Data maps letters to known counties
        data: {
            "B": ["Bedfordshire", "Berkshire", "Buckinghamshire", "Bristol"],
            "S": ["Shropshire", "Somerset", "Staffordshire", "Suffolk", "Surrey", "Sussex"],
            "W": ["Warwickshire", "Westmorland", "Wiltshire", "Worcestershire"],
            "C": ["Cambridgeshire", "Cheshire", "Cornwall", "Cumberland"],
            "N": ["Norfolk", "Northamptonshire", "Northumberland", "Nottinghamshire"],
            "L": ["Lancashire", "Leicestershire", "Lincolnshire"],
            "Y": ["Yorkshire"]
        }
    },
    europeanCountries: {
        category: "Geography",
        promptLetter: ["S", "F", "B", "A", "M"],
        data: {
            "S": ["Spain", "Sweden", "Switzerland", "Slovakia", "Slovenia", "Serbia"],
            "F": ["France", "Finland"],
            "B": ["Belgium", "Bulgaria", "Belarus", "Bosnia and Herzegovina"],
            "A": ["Austria", "Albania", "Andorra"],
            "M": ["Monaco", "Montenegro", "Moldova", "Malta"]
        }
    },
    usStates: {
        category: "Geography",
        promptLetter: ["M", "N", "C", "P"],
        data: {
            "M": ["Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana"],
            "N": ["Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota"],
            "C": ["California", "Colorado", "Connecticut"],
            "P": ["Pennsylvania"]
        }
    }
};
