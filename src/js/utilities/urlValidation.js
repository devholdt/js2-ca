import message from "../components/message.js";

/**
 * Validates an image URL to check if it's accessible and represents an image.
 *
 * @param {string} url - The URL of the image to validate.
 * @returns {Promise<boolean>} -  A Promise that resolves to 'true' if the URL is
 *                                valid or 'false' if the URL is invalid.
 */
export async function isValidImageUrl(url) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      // URL is not accessible.
      return false;
    }

    const contentType = response.headers.get("content-type");

    if (contentType && contentType.startsWith("image/")) {
      // It's an image.
      return true;
    } else {
      // It's not an image.
      return false;
    }
  } catch (error) {
    message(
      "error",
      "An error occured when attempting to validate image URL.",
      ".message-posts"
    );
    return false;
  }
}
