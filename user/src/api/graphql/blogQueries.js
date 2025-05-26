import { gql } from '@apollo/client';

// Fragment cho các trường cơ bản của BlogPostType
export const BLOG_POST_SUMMARY_FIELDS_FRAGMENT = gql`
  fragment BlogPostSummaryFields on BlogPostType { # Đảm bảo BlogPostType là tên đúng
    id
    title
    slug
    excerpt # Hoặc một phần của content
    featuredImageUrl # Hoặc imageUrl
    publishedAt # Hoặc createdAt
    author { # Giả sử có AuthorType hoặc lấy từ CustomerType
      id
      firstName
      lastName
      # avatarUrl
    }
    # category { id name slug } # Nếu bài viết thuộc 1 category chính
    tags { # Giả sử là mảng BlogTagType
      id
      name
      slug
    }
    # commentCount
    # viewCount
  }
`;

export const BLOG_POST_DETAIL_FIELDS_FRAGMENT = gql`
  fragment BlogPostDetailFields on BlogPostType {
    ...BlogPostSummaryFields
    content # Nội dung đầy đủ của bài viết (HTML hoặc Markdown)
    # metaTitle
    # metaDescription
    # canonicalUrl
  }
  ${BLOG_POST_SUMMARY_FIELDS_FRAGMENT}
`;

// Fragment cho BlogCommentType
export const BLOG_COMMENT_FIELDS_FRAGMENT = gql`
  fragment BlogCommentFields on BlogCommentType { # Đảm bảo BlogCommentType là tên đúng
    id
    content
    createdAt
    author { # CustomerType hoặc một AuthorType riêng
      id
      firstName
      lastName
      # avatarUrl
    }
    # parentCommentId # Nếu có bình luận lồng nhau
    # replies { ...BlogCommentFields } # Cho bình luận lồng nhau
  }
`;

// Query để lấy danh sách bài viết blog (phân trang, filter)
export const GET_BLOG_POSTS_QUERY = gql`
  query GetBlogPosts(
    $limit: Int
    $offset: Int
    $sortBy: String # Ví dụ: "publishedAt", "viewCount"
    $sortOrder: String # ASC hoặc DESC
    $categoryId: ID
    $tagId: ID
    $authorId: ID
    $searchTerm: String
  ) {
    blogPosts(
      limit: $limit
      offset: $offset
      sortBy: $sortBy
      sortOrder: $sortOrder
      categoryId: $categoryId
      tagId: $tagId
      authorId: $authorId
      searchTerm: $searchTerm
    ) {
      # Backend có thể trả về một payload chứa posts và totalCount
      # Ví dụ:
      # posts {
      #   ...BlogPostSummaryFields
      # }
      # totalCount
      # Nếu trả về mảng BlogPostType[] trực tiếp:
      ...BlogPostSummaryFields
    }
  }
  ${BLOG_POST_SUMMARY_FIELDS_FRAGMENT}
`;

// Query để lấy chi tiết một bài viết blog bằng slug hoặc ID
export const GET_BLOG_POST_DETAILS_QUERY = gql`
  query GetBlogPostDetails($slug: String, $id: ID) {
    blogPost(slug: $slug, id: $id) { # Query 'blogPost' từ backend typeDefs
      ...BlogPostDetailFields
      comments { # Lấy danh sách bình luận cho bài viết
        ...BlogCommentFields
      }
    }
  }
  ${BLOG_POST_DETAIL_FIELDS_FRAGMENT}
  ${BLOG_COMMENT_FIELDS_FRAGMENT}
`;

// Query để lấy danh sách Blog Categories (nếu có)
// export const GET_BLOG_CATEGORIES_QUERY = gql`
//   query GetBlogCategories {
//     blogCategories { # Query 'blogCategories' từ backend typeDefs
//       id
//       name
//       slug
//       # postCount
//     }
//   }
// `;

// Query để lấy danh sách Blog Tags
export const GET_BLOG_TAGS_QUERY = gql`
  query GetBlogTags {
    blogTags { # Query 'blogTags' từ backend typeDefs
      id
      name
      slug
      # postCount
    }
  }
`;