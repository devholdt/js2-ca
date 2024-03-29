import { formatDate } from "../utilities/formatDate.mjs";
import { handleEdit } from "./editPost.mjs";
import { handleDelete } from "../utilities/clickEvents.mjs";
import { getUser } from "../utilities/storage.mjs";
import { httpRequest } from "../utilities/httpRequest.mjs";
import { handleImageModal } from "./handleImageModal.mjs";
import { handleComment } from "./handleComment.mjs";
import { handlePostReaction } from "./handlePostReaction.mjs";
import "../settings/common.mjs";

// Initialize variables for pagination
let loading = false;

/**
 * Displays a list of posts in a container and handles pagination.
 *
 * @param {string} url - The URL to fetch the posts from.
 */
export async function displayPosts(url) {
  const postsContainer = document.querySelector(".posts-container");
  const loadMoreButton = document.getElementById("loadMoreButton");
  const postsPerPage = 10;

  // Check if posts are currently being loaded
  if (loading) return;

  // Set the loading flag to prevent multiple requests
  loading = true;

  // Calculate the end index for displaying posts
  const end = start + postsPerPage;

  // Fetch posts from the specified URL
  const posts = await httpRequest(url);

  // Handle the case when no posts are found
  if (posts.length === 0) {
    postsContainer.innerHTML = `<p class="no-posts">No posts found</p>`;
  }

  // Iterate through the posts and create post elements
  for (let i = start; i < end && i < posts.length; i++) {
    const post = posts[i];

    // Create post element
    const postElement = document.createElement("div");

    // Populate the post element with content
    postElement.innerHTML = generatePostHTML(post);

    // Append the post element to the posts container
    postsContainer.appendChild(postElement);
  }

  // Update the start index and reset the loading flag
  start = end;
  loading = false;

  // Hide the load more button if there are no more posts to load
  if (start >= posts.length) {
    loadMoreButton.style.display = "none";
  } else {
    loadMoreButton.style.display = "flex";
  }

  // Add event listeners to delete buttons
  const deleteButtons = document.querySelectorAll(".btn-delete");
  deleteButtons.forEach((button) => {
    button.addEventListener("click", handleDelete);
  });

  // Add event listeners to edit buttons
  const editButtons = document.querySelectorAll(".btn-edit");
  editButtons.forEach((button) => {
    button.addEventListener("click", handleEdit);
  });

  const likeButtons = document.querySelectorAll(".btn-like");
  likeButtons.forEach((button) => {
    button.addEventListener("click", handlePostReaction);
  });

  // Initialize image modal functionality
  handleImageModal();

  // Handle post commenting functionality
  handleComment();
}

/**
 * Extract common post HTML generation logic to a function.
 *
 * @param {Object} post - The post object to display.
 * @returns {string} - HTML content for the post.
 */
export function generatePostHTML(post) {
  const userData = getUser(); // Get user data for comparison

  // Initialize variables for post media, modal content, and button group
  let postMedia = "";
  let modalContent = "";
  let buttonGroup = "";
  let postComments = "";
  let commentsContainer = "";

  // Convert post dates to formatted strings
  const postDate = new Date(post.created);
  const updateDate = new Date(post.updated);
  const formattedPostDate = formatDate(postDate);
  const formattedUpdateDate = formatDate(updateDate);
  let updatedTime = `(<i>Edit ${formattedUpdateDate}</i>)`;

  // Check if post and update dates are the same
  if (formattedPostDate === formattedUpdateDate) {
    updatedTime = "";
  }

  // Handle post media and modal content
  if (post.media) {
    const modalId = `modal-${post.id}`;

    postMedia = `
        <div class="thumbnail" id="thumbnailImgContainer">
          <img src="${post.media}" alt="Post media thumbnail" class="thumbnail-img" data-modal-id="${modalId}" onerror='this.src="https://imageupload.io/ib/44rlPagSlwtwkei_1697114759.png"'>
        </div>`;

    modalContent = `
        <div class="modal" id="${modalId}">
          <i class="fa-solid fa-circle-xmark close-btn" data-modal-id="${modalId}"></i>
          <img src="${post.media}" alt="Full-sized post media" class="modal-content" onerror='this.src="https://imageupload.io/ib/44rlPagSlwtwkei_1697114759.png"'>
        </div>`;
  }

  // Generate button group based on user data
  if (post.author.name === userData.name) {
    buttonGroup = `
      <div class="dropdown">
        <button class="btn btn-outline-dark dropdown-toggle rounded-0" type="button" id="postInteraction" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          Post Actions
        </button>
        <div class="dropdown-menu rounded-0" aria-labelledby="postInteraction">
          <button class="dropdown-item btn-edit" data-id="${post.id}" data-name="${post.author.name}">
            <i class="fa-regular fa-pen-to-square" data-id="${post.id}" data-name="${post.author.name}"></i>
            Edit post
          </button>
          <button class="dropdown-item btn-delete" data-id="${post.id}">
            <i class="fa-regular fa-trash-can" data-id="${post.id}"></i>
            Delete post
          </button>
        </div>
      </div>`;
  }

  // Handle displaying of post comments
  if (post.comments.length > 0) {
    function sortComments(a, b) {
      return a.id - b.id;
    }

    post.comments.sort(sortComments);

    post.comments.forEach((comment) => {
      const commentDate = new Date(comment.created);
      const formattedCommentDate = formatDate(commentDate);

      postComments += `
          <div class="d-flex rounded-bottom post-comment">
      
            <div class="card post p-1">
      
              <div class="card-header border-0 py-1">
                <div class="d-flex align-items-center">

                  <div class="post-profile-link-lg gap-2">
                    <p>${comment.owner}</p>
                    <a href="profile.html?name=${comment.owner}" class="fst-italic fw-light">visit profile</a>
                  </div>

                  <div class="post-profile-link-sm align-items-end">
                    <a href="profile.html?name=${comment.owner}" class="fs-6">
                      <button class="btn btn-outline-primary">
                        ${comment.owner}
                      </button>
                    </a>
                  </div>

                </div>
              </div>
      
              <div class="card-content border-bottom">
                <div class="card-body">
                  <div class="card-text">${comment.body}</div>
                </div>
              </div>
      
              <div class="d-flex justify-content-between post-bottom">
                <p class="mx-2 my-1">${formattedCommentDate}</p>
                <p class="mx-2 my-1 fw-light">id: ${comment.id}</p>
              </div>
      
            </div>
      
          </div>`;
    });

    commentsContainer = `
        <div class="d-flex flex-column gap-2">
          <h4 class="fs-6 ms-1 mb-0 mt-3">Comments</h4>
          <div class="comments d-flex flex-column gap-2 m-0">
            ${postComments}
          </div>
        </div>`;
  }

  // Return the HTML content for the post
  return `
    <div class="p-2 bg-light mb-4 rounded">
      <div class="card post border p-1" data-id="${post.id}">
        <div class="card-header border-0">
          <div class="d-flex justify-content-between align-items-center">

            <div class="post-profile-link-lg gap-2 align-items-end">
              <p class="fs-5">${post.author.name}</p>
              <a href="profile.html?name=${
                post.author.name
              }" class="fst-italic fw-light">visit profile</a>
            </div>

            <div class="post-profile-link-sm align-items-end">
              <a href="profile.html?name=${post.author.name}" class="fs-6">
                <button class="btn btn-primary">
                  ${post.author.name}
                </button>
              </a>
            </div>

            ${buttonGroup}
          </div>
        </div>
        
        <div class="card-content border-bottom">
          <div class="card-body">
            <div class="row d-flex justify-content-between">
              <h3 class="col-8 fs-4 fw-normal post-title">${post.title}</h3>
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
            
        <div class="d-flex justify-content-between post-bottom">
          <p class="mx-2 my-1">${formattedPostDate} <span class="post-updated-time">${updatedTime}</span></p>
          <div class="btn-group m-0" role="group" aria-label="Post interaction">
            <button class="btn border-0 m-0 p-0 btn-like"data-id="${post.id}">
              <i class="fa-regular fa-thumbs-up" data-id="${post.id}"></i>
              ${post._count.reactions}
            </button>
          </div>
          <p class="mx-2 my-1 fw-light">id: ${post.id}</p>
        </div>
      </div>

      <div class="comment-form-container">

        <form class="mx-auto mt-1 comment-form" data-id="${post.id}">

          <label for "commentInput" class="form-label mb-0 mt-2 hide-label">Comment</label>

          <div class="d-flex bg-white">
            <input type="text" class="form-control shadow-none rounded-0 rounded-start" id="commentInput" name="commentInput" placeholder="comment" minlength="2" required>
            <button type="submit" data-id="${
              post.id
            }" class="comment-button btn btn-outline-post p-0 rounded-0 rounded-end" title="Comment">Post</button>
          </div>

        </form>
      
        <div class="comments-container">${commentsContainer}</div>
      </div>
    </div>`;
}
