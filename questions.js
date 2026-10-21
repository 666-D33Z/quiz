// Master Data & Rule Definitions (Clean & Verified)
const listMasterData = {
    englishCounties: {
        category: "Geography - Counties",
        promptLetter: ["B", "S", "W", "C", "N", "L", "Y"],
        titleName: "English Counties",
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
        category: "Geography - Europe",
        promptLetter: ["S", "F", "B", "A", "M", "I", "G"],
        titleName: "European Countries",
        data: {
            "S": ["Spain", "Sweden", "Switzerland", "Slovakia", "Slovenia", "Serbia"],
            "F": ["France", "Finland"],
            "B": ["Belgium", "Bulgaria", "Belarus", "Bosnia and Herzegovina"],
            "A": ["Austria", "Albania", "Andorra"],
            "M": ["Monaco", "Montenegro", "Moldova", "Malta"],
            "I": ["Italy", "Ireland", "Iceland"],
            "G": ["Germany", "Greece"]
        }
    },
    usStates: {
        category: "Geography - US States",
        promptLetter: ["M", "N", "C", "P", "T", "V"],
        titleName: "US States",
        data: {
            "M": ["Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana"],
            "N": ["Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota"],
            "C": ["California", "Colorado", "Connecticut"],
            "P": ["Pennsylvania"],
            "T": ["Texas", "Tennessee"],
            "V": ["Virginia", "Vermont"]
        }
    }
};
