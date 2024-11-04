const API_KEY = "0ea2bdb2e0714ed0a010339f866ae4b0"; // Ensure your API key is valid
const url = "https://newsapi.org/v2/everything?q=";

// AWS SDK setup for Polly
AWS.config.region = 'ap-south-1'; // e.g., 'us-west-2'
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'ap-south-1:3b5fc555-1572-45d6-a5ca-5bd7228073cd', // Replace with your Cognito Identity Pool ID
});

const polly = new AWS.Polly();

// Function to convert text to speech using AWS Polly
function narrateText(text) {
    console.log("Narrating text: ", text); // Debug: Check if Polly is being called
    const params = {
        Text: text,
        OutputFormat: 'mp3',
        VoiceId: 'Joanna', // You can choose different voices like 'Matthew', 'Kimberly', etc.
    };

    polly.synthesizeSpeech(params, (err, data) => {
        if (err) {
            console.error('Error with Polly TTS:', err); // Debug: Log Polly errors
        } else {
            const audioUrl = URL.createObjectURL(new Blob([data.AudioStream]));
            const audioElement = new Audio(audioUrl);
            audioElement.play();
        }
    });
}

// Fetch news articles on page load
window.addEventListener("load", () => fetchNews("Technology"));

// Fetch news articles from NewsAPI
async function fetchNews(query) {
    try {
        console.log("Fetching news for query: ", query); // Debug: Log query
        const res = await fetch(`${url}${query}&apiKey=${API_KEY}`);
        if (!res.ok) {
            throw new Error(`Failed to fetch news: ${res.status}`);
        }
        const data = await res.json();
        console.log("Fetched data: ", data); // Debug: Log fetched data
        bindData(data.articles);
    } catch (error) {
        console.error('Error fetching news:', error); // Debug: Log errors during fetching
    }
}

// Bind news data to the HTML template
function bindData(articles) {
    const cardsContainer = document.getElementById("cardscontainer");
    const newsCardTemplate = document.getElementById("template-news-card");

    cardsContainer.innerHTML = "";

    if (!articles || articles.length === 0) {
        console.warn("No articles found!"); // Debug: No articles available
        return;
    }

    articles.forEach((article) => {
        if (!article.urlToImage) return;

        const cardClone = newsCardTemplate.content.cloneNode(true);
        fillDataInCard(cardClone, article);
        cardsContainer.appendChild(cardClone);
    });
}

// Fill news data into the cloned card template
function fillDataInCard(cardClone, article) {
    const newsImg = cardClone.querySelector("#news-img");
    const newsTitle = cardClone.querySelector("#news-title");
    const newsSource = cardClone.querySelector("#news-source");
    const newsDesc = cardClone.querySelector("#news-desc");

    newsImg.src = article.urlToImage;
    newsTitle.innerHTML = `${article.title.slice(0, 60)}...`;
    newsDesc.innerHTML = `${article.description.slice(0, 150)}...`;

    const date = new Date(article.publishedAt).toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
    newsSource.innerHTML = `${article.source.name} · ${date}`;

    // Add event listener for text-to-speech on news headline
    cardClone.firstElementChild.addEventListener("click", () => {
        window.open(article.url, "_blank");
        narrateText(article.title || "No title available"); // Pass headline to narrate
    });
}

// Navigation item click handler
let curSelectedNav = null;
function onNavItemClick(id) {
    fetchNews(id);
    const navItem = document.getElementById(id);
    curSelectedNav?.classList.remove("active");
    curSelectedNav = navItem;
    curSelectedNav.classList.add("active");
}

// Search functionality
const searchButton = document.getElementById("search-button");
const searchText = document.getElementById("search-text");

searchButton.addEventListener("click", () => {
    const query = searchText.value;
    if (!query) {
        console.warn("Search query is empty!"); // Debug: Warn if search is empty
        return;
    }
    fetchNews(query);
    curSelectedNav?.classList.remove("active");
    curSelectedNav = null;
});
