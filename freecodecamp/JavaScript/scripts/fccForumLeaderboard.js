const forumLatest =
  'https://cdn.freecodecamp.org/curriculum/forum-latest/latest.json';
const forumTopicUrl = 'https://forum.freecodecamp.org/t/';
const forumCategoryUrl = 'https://forum.freecodecamp.org/c/';
const avatarUrl = 'https://cdn.freecodecamp.org/curriculum/forum-latest';
const postsContainer = document.getElementById("posts-container");

const allCategories = {
  299: { category: 'Career Advice', className: 'career' },
  409: { category: 'Project Feedback', className: 'feedback' },
  417: { category: 'freeCodeCamp Support', className: 'support' },
  421: { category: 'JavaScript', className: 'javascript' },
  423: { category: 'HTML - CSS', className: 'html-css' },
  424: { category: 'Python', className: 'python' },
  432: { category: 'You Can Do This!', className: 'motivation' },
  560: { category: 'Backend Development', className: 'backend' }
};

function timeAgo (timeStamp) {
  const dateObj = new Date(timeStamp);
  const currentTime = new Date();
  const dateObjMS = dateObj.getTime();
  const currentTimeMS = currentTime.getTime();
  const differenceMS = dateObjMS > currentTimeMS ? dateObjMS - currentTimeMS : currentTimeMS - dateObjMS;
  console.log("curr time " + currentTime);
  console.log("ms difference " + differenceMS);
  const difference = Math.floor(differenceMS / 1000);
  console.log("second difference " + difference);
  const diffDays = (Math.floor(difference / 86400));
  const diffHours = Math.floor((difference % 86400) / 3600);
  const diffMinutes = Math.floor( (difference % 3600)/60 );
  const diffSeconds = (difference % 3600) % 60;
  
  console.log(`The difference time is days ${diffDays} hours: ${diffHours} minutes: ${diffMinutes} seconds: ${diffSeconds}`);

    if ((diffDays * 1440) + (diffHours * 60) + diffMinutes < 60 ) {
    return `${(diffHours * 60) + diffMinutes}m ago`;
  } else if (difference < 86400) {
    return `${diffHours}h ago`;
  } else {
    return `${diffDays}d ago`
  }
}

const viewCount = (views) => 
  views >= 1000 ? `${Math.floor(views/1000)}k`: views;

function forumCategory(id) {
  const isValid = (id in allCategories);
  const category = allCategories[id] || {};
  if (!isValid) {
    category.className = "general"
    category.category = "General"
  }
  return `<a class="category ${category.className}" href="${forumCategoryUrl}${category.className}/${id}">
    ${category.category}
  </a>`
}

function avatars(posters, users) {
  return posters.map(poster => {
    const user = users.filter(user => user.id === poster.user_id)[0]
    let src = user.avatar_template.replace("{size}", 30);
    if (/^\/user_avatar/.test(src)) {
      src = `${avatarUrl}${src}`
    }
    return `<img alt="${user.name}" src="${src}"/>`
  }).join("")
}

function showLatestPosts({users, topic_list}) {
  const htmlString = topic_list.topics.map(topic => {
    const {id, slug, title, category_id, posters, posts_count, views, bumped_at} = topic;
    return`<tr>
      <td>
        <a class="post-title" href="${forumTopicUrl}${slug}/${id}">${title}</a>
        ${forumCategory(category_id)}
      </td>
      <td>
        <div class="avatar-container">${avatars(posters, users)}</div>
      </td>
      <td>${posts_count - 1}</td>
      <td>${views}</td>
      <td>${timeAgo(bumped_at)}</td>
    </tr>`
  }).join("\n")
  document.getElementById("posts-container").innerHTML = htmlString
  return htmlString;
}

async function fetchData () {
try {
  let response = await fetch(`https://cdn.freecodecamp.org/curriculum/forum-latest/latest.json`);
    let userData = await response.json();
    showLatestPosts(userData);
  } catch (error) {
    console.log("Error fetching user data:", error);
  }
}
fetchData();