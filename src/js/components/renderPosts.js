import { httpRequest } from "../utilities/httpRequest.js";
import { handleDelete } from "../utilities/clickEvents.js";
import { handleEdit } from "./editPost.js";
import { getUser } from "../utilities/storage.js";
import { formatDate } from "../utilities/formatDate.js";
import message from "./message.js";
import { API_URLS } from "../settings/constants.js";
import { generatePostsUrl, currentPage } from "./pagination.js";

/**
 * Renders posts from the API by sending an HTTP GET request and
 * displays them in the DOM.
 *
 * @param {string} url - The URL to send the HTTP Request to fetch posts.
 * @returns
 */
export async function renderPosts(url) {
  const postsContainer = document.querySelector(".posts-container");
  const userData = getUser();

  try {
    const posts = await httpRequest(url, "GET");

    if (posts.length === 0) {
      postsContainer.innerHTML = `<p class="no-posts">No posts found</p>`;
    }

    postsContainer.innerHTML = "";

    for (const post of posts) {
      let postMedia = "";
      let modalContent = "";
      let buttonGroup = "";

      const postDate = new Date(post.created);
      const updateDate = new Date(post.updated);
      const formattedPostDate = formatDate(postDate);
      const formattedUpdateDate = formatDate(updateDate);
      let updatedTime = `(<i>Edit ${formattedUpdateDate}</i>)`;

      if (formattedPostDate === formattedUpdateDate) {
        updatedTime = "";
      }

      if (post.media) {
        const modalId = `modal-${post.id}`;
        postMedia = `
          <div class="thumbnail">
            <img src="${post.media}" alt="Post media thumbnail" class="thumbnail-img" data-modal-id="${modalId}">
          </div>`;
        modalContent = `
          <div class="modal" id="${modalId}">
            <i class="fa-solid fa-circle-xmark close-btn" data-modal-id="${modalId}"></i>
            <img src="${post.media}" alt="Full-sized post media" class="modal-content">
          </div>`;
      }

      if (post.author.name === userData.name) {
        buttonGroup = `
        <div class="btn-group m-0" role="group" aria-label="Post interaction">
          <button class="btn btn-light p-0 btn-edit" title="Edit" data-id="${post.id}" data-name="${post.author.name}">
          <i class="fa-regular fa-pen-to-square" data-id="${post.id}" data-name="${post.author.name}"></i>
          </button>
          <button class="btn btn-light p-0 btn-delete" title="Delete" data-id="${post.id}">
          <i class="fa-regular fa-trash-can" data-id="${post.id}"></i>
          </button>
        </div>`;
      } else {
        buttonGroup = `
        <div class="btn-group m-0" role="group" aria-label="Post interaction">
          <button class="btn btn-outline-secondary p-0 btn-like" title="Like">
          <i class="fa-regular fa-thumbs-up"></i>
          </button>
          <button class="btn btn-outline-secondary p-0 btn-comment" title="Comment">
          <i class="fa-regular fa-comment"></i>
          </button>
        </div>`;
      }

      postsContainer.innerHTML += `
      <div class="card m-4 post" data-id="${post.id}">

        <div class="card-header border-0">
          <div class="d-flex justify-content-between align-items-center">
            <p class="fs-6 card-header_name">${post.author.name}</p>
            <div class="card-follow" data-name="${post.author.name}">
              <i class="fa-regular fa-square-plus follow-button" title="Follow" data-name="${
                post.author.name
              }"></i>
            </div>
          </div>
        </div>
        
        <div class="card-content border-bottom">
          <div class="card-body">
            <div class="row d-flex justify-content-between">
              <p class="col-8 fs-4">${post.title}</p>
              <div class="col-4 p-0 d-flex align-items-start justify-content-end flex-wrap gap-1 post-tags">
                ${post.tags
                  .map((tag) => `<span class="badge bg-dark">${tag}</span>`)
                  .join(" ")}
              </div>
            </div>
            <p class="card-text">${post.body}</p>
            ${postMedia}
            ${modalContent}
          </div>
        </div>
            
        <div class="d-flex justify-content-between align-items-center">
          <p class="d-flex justify-content-end mx-2 mt-0 mb-1 post-date">${formattedPostDate} ${updatedTime}</p>
          ${buttonGroup}
        </div>
            
      </div>`;
    }
  } catch (error) {
    console.log(error);
    message(
      "error",
      "An error occured with the API call",
      ".message-posts",
      null
    );
  }

  const deleteButtons = document.querySelectorAll(".btn-delete");

  deleteButtons.forEach((button) => {
    button.addEventListener("click", handleDelete);
  });

  const editButtons = document.querySelectorAll(".btn-edit");

  editButtons.forEach((button) => {
    button.addEventListener("click", handleEdit);
  });

  attachEventListeners();
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.add("modal-active");
  modal.addEventListener("click", closeModal);
  modal.querySelector(".modal-content").addEventListener("click", (e) => {
    e.stopPropagation();
  });
}

function closeModal(e) {
  if (
    e.target.classList.contains("modal") ||
    e.target.classList.contains("close-btn")
  ) {
    const modals = document.querySelectorAll(".modal");
    modals.forEach((modal) => {
      modal.classList.remove("modal-active");
    });
  }
}

function attachEventListeners() {
  const thumbnailImages = document.querySelectorAll(".thumbnail-img");

  thumbnailImages.forEach((thumbnail) => {
    thumbnail.addEventListener("click", () => {
      const modalId = thumbnail.getAttribute("data-modal-id");
      openModal(modalId);
    });
  });
}

(async function handleSearch() {
  const searchResults = document.querySelector(".search-results");
  const postsContainer = document.querySelector(".posts-container");
  const input = document.getElementById("searchInput");
  const form = document.querySelector(".form-search");
  const userData = getUser();

  try {
    const posts = await httpRequest(
      `${API_URLS.POSTS}?_author=true&_tag=${input.value}`,
      "GET"
    );

    function filterPosts(posts, value) {
      return posts.filter((post) => {
        const lowercaseValue = value.toLowerCase();
        if (
          post.author.name.toLowerCase().includes(lowercaseValue) ||
          post.title.toLowerCase().includes(lowercaseValue) ||
          post.tags.some((tag) => tag.toLowerCase().includes(lowercaseValue))
        ) {
          return true;
        } else {
          return false;
        }
      });
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const filteredPosts = filterPosts(posts, input.value);

      postsContainer.innerHTML = "";

      if (filteredPosts.length === 0) {
        searchResults.innerHTML = `<p class="d-flex justify-content-center my-5">No results found</p>`;
        return false;
      }

      searchResults.innerHTML = "";

      filteredPosts.forEach((post) => {
        let postMedia = "";
        let modalContent = "";
        let buttonGroup = "";

        const postDate = new Date(post.created);
        const updateDate = new Date(post.updated);
        const formattedPostDate = formatDate(postDate);
        const formattedUpdateDate = formatDate(updateDate);
        let updatedTime = `(<i>Edit ${formattedUpdateDate}</i>)`;

        if (formattedPostDate === formattedUpdateDate) {
          updatedTime = "";
        }

        if (post.media) {
          const modalId = `modal-${post.id}`;
          postMedia = `
            <div class="thumbnail">
              <img src="${post.media}" alt="Post media thumbnail" class="thumbnail-img" data-modal-id="${modalId}">
            </div>`;
          modalContent = `
            <div class="modal" id="${modalId}">
              <i class="fa-solid fa-circle-xmark close-btn" data-modal-id="${modalId}"></i>
              <img src="${post.media}" alt="Full-sized post media" class="modal-content">
            </div>`;
        }

        if (post.author.name === userData.name) {
          buttonGroup = `
          <div class="btn-group m-0" role="group" aria-label="Post interaction">
            <button class="btn btn-light p-0 btn-edit" title="Edit" data-id="${post.id}" data-name="${post.author.name}">
            <i class="fa-regular fa-pen-to-square" data-id="${post.id}" data-name="${post.author.name}"></i>
            </button>
            <button class="btn btn-light p-0 btn-delete" title="Delete" data-id="${post.id}">
            <i class="fa-regular fa-trash-can" data-id="${post.id}"></i>
            </button>
          </div>`;
        } else {
          buttonGroup = `
          <div class="btn-group m-0" role="group" aria-label="Post interaction">
            <button class="btn btn-outline-secondary p-0 btn-like" title="Like">
            <i class="fa-regular fa-thumbs-up"></i>
            </button>
            <button class="btn btn-outline-secondary p-0 btn-comment" title="Comment">
            <i class="fa-regular fa-comment"></i>
            </button>
          </div>`;
        }

        searchResults.innerHTML += `
        <div class="card m-4 post" data-id="${post.id}">

          <div class="card-header border-0">
            <div class="d-flex justify-content-between align-items-center">
              <p class="fs-6 card-header_name">${post.author.name}</p>
              <div class="card-follow" data-name="${post.author.name}">O</div>
            </div>
          </div>

          <div class="card-content border-bottom">
            <div class="card-body">
              <div class="row d-flex justify-content-between">
                <p class="col-8 fs-4">${post.title}</p>
                <div class="col-4 p-0 d-flex align-items-start justify-content-end flex-wrap gap-1 post-tags">
                  ${post.tags
                    .map((tag) => `<span class="badge bg-dark">${tag}</span>`)
                    .join(" ")}
                </div>
              </div>
              <p class="card-text">${post.body}</p>
              ${postMedia}
              ${modalContent}
            </div>
          </div>

          <div class="d-flex justify-content-between align-items-center">
           <p class="d-flex justify-content-end mx-2 mt-0 mb-1 post-date">${formattedPostDate} ${updatedTime}</p>
           ${buttonGroup}
          </div>
            
        </div>`;
      });
    });

    input.addEventListener("input", () => {
      if (input.value.length === 0) {
        renderPosts(generatePostsUrl(currentPage));
      }
    });
  } catch (error) {
    console.error("An error occured");
  }
})();
