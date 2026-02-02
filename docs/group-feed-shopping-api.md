# Group, Feed & Shopping List API 명세서

## 공통 정보

**Base URL**: `http://localhost:8080`

**인증**: `Authorization: Bearer {accessToken}`

**공통 응답 형식**:
```json
{
  "code": "SUCCESS",
  "message": "성공",
  "data": { ... }
}
```

---

## Enum 타입

### GroupType
| 값 | 설명 |
|----|------|
| `COUPLE` | 커플 |
| `FAMILY` | 가족 |
| `FRIENDS` | 친구 |
| `ETC` | 기타 |

### GroupRole
| 값 | 설명 |
|----|------|
| `ADMIN` | 관리자 |
| `MEMBER` | 일반 멤버 |

### FeedType
| 값 | 설명 |
|----|------|
| `USER_CREATED` | 사용자 생성 피드 |
| `DAILY_MENU_NOTIFICATION` | 오늘의 식단 알림 |
| `NEW_RECIPE_ADDED` | 새 레시피 추가 알림 |

---

## Group API

### 1. 그룹 생성
```
POST /api/v1/groups
```

**인증**: 필수

**Request Body**:
```json
{
  "name": "우리 가족",           // 필수, 최대 50자
  "description": "가족 레시피 공유", // 선택, 최대 500자
  "thumbnailImgUrl": "https://...", // 선택
  "groupType": "FAMILY"          // 필수 (COUPLE, FAMILY, FRIENDS, ETC)
}
```

**Response** (201 Created):
```json
{
  "code": "SUCCESS",
  "message": "성공",
  "data": {
    "id": 1,
    "name": "우리 가족",
    "description": "가족 레시피 공유",
    "thumbnailImgUrl": "https://...",
    "groupType": "FAMILY",
    "memberCount": 1,
    "createdAt": "2025-01-15T10:30:00"
  }
}
```

---

### 2. 그룹 수정
```
PUT /api/v1/groups/{groupId}
```

**인증**: 필수 (ADMIN 권한)

**Path Parameters**:
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| groupId | Long | 그룹 ID |

**Request Body**:
```json
{
  "name": "우리 가족 (수정)",
  "description": "수정된 설명",
  "thumbnailImgUrl": "https://...",
  "groupType": "FAMILY"
}
```

**Response** (200 OK):
```json
{
  "code": "SUCCESS",
  "message": "성공",
  "data": null
}
```

---

### 3. 그룹 삭제
```
DELETE /api/v1/groups/{groupId}
```

**인증**: 필수 (ADMIN 권한)

**Path Parameters**:
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| groupId | Long | 그룹 ID |

**Response** (200 OK):
```json
{
  "code": "SUCCESS",
  "message": "성공",
  "data": null
}
```

---

### 4. 그룹 상세 조회
```
GET /api/v1/groups/{groupId}
```

**인증**: 필수

**Path Parameters**:
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| groupId | Long | 그룹 ID |

**Response** (200 OK):
```json
{
  "code": "SUCCESS",
  "message": "성공",
  "data": {
    "id": 1,
    "name": "우리 가족",
    "description": "가족 레시피 공유",
    "thumbnailImgUrl": "https://...",
    "groupType": "FAMILY",
    "memberCount": 3,
    "createdAt": "2025-01-15T10:30:00"
  }
}
```

---

### 5. 내 그룹 목록 조회
```
GET /api/v1/groups/my
```

**인증**: 필수

**Response** (200 OK):
```json
{
  "code": "SUCCESS",
  "message": "성공",
  "data": [
    {
      "id": 1,
      "name": "우리 가족",
      "description": "가족 레시피 공유",
      "thumbnailImgUrl": "https://...",
      "groupType": "FAMILY",
      "myRole": "ADMIN",
      "createdAt": "2025-01-15T10:30:00"
    },
    {
      "id": 2,
      "name": "친구들",
      "description": null,
      "thumbnailImgUrl": null,
      "groupType": "FRIENDS",
      "myRole": "MEMBER",
      "createdAt": "2025-01-20T14:00:00"
    }
  ]
}
```

---

### 6. 그룹 멤버 조회
```
GET /api/v1/groups/{groupId}/members
```

**인증**: 필수

**Path Parameters**:
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| groupId | Long | 그룹 ID |

**Response** (200 OK):
```json
{
  "code": "SUCCESS",
  "message": "성공",
  "data": [
    {
      "memberId": 1,
      "name": "홍길동",
      "email": "hong@example.com",
      "role": "ADMIN",
      "joinedAt": "2025-01-15T10:30:00"
    },
    {
      "memberId": 2,
      "name": "김철수",
      "email": "kim@example.com",
      "role": "MEMBER",
      "joinedAt": "2025-01-16T09:00:00"
    }
  ]
}
```

---

### 7. 초대 코드로 그룹 미리보기
```
GET /api/v1/groups/invite/{inviteCode}
```

**인증**: 불필요

**Path Parameters**:
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| inviteCode | String | 초대 코드 |

**Response** (200 OK):
```json
{
  "code": "SUCCESS",
  "message": "성공",
  "data": {
    "id": 1,
    "name": "우리 가족",
    "description": "가족 레시피 공유",
    "thumbnailImgUrl": "https://...",
    "groupType": "FAMILY",
    "memberCount": 3
  }
}
```

---

### 8. 초대 코드로 그룹 가입
```
POST /api/v1/groups/invite/{inviteCode}/join
```

**인증**: 필수

**Path Parameters**:
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| inviteCode | String | 초대 코드 |

**Response** (200 OK):
```json
{
  "code": "SUCCESS",
  "message": "성공",
  "data": {
    "id": 1,
    "name": "우리 가족",
    "description": "가족 레시피 공유",
    "thumbnailImgUrl": "https://...",
    "groupType": "FAMILY",
    "memberCount": 4,
    "createdAt": "2025-01-15T10:30:00"
  }
}
```

---

### 9. 초대 코드 조회/생성
```
GET /api/v1/groups/{groupId}/invites
```

**인증**: 필수

**Path Parameters**:
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| groupId | Long | 그룹 ID |

**Response** (200 OK):
```json
{
  "code": "SUCCESS",
  "message": "성공",
  "data": {
    "inviteCode": "ABC123XY",
    "expiresAt": "2025-01-22T10:30:00"
  }
}
```

---

### 10. 멤버 강퇴
```
DELETE /api/v1/groups/{groupId}/members/{memberId}
```

**인증**: 필수 (ADMIN 권한)

**Path Parameters**:
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| groupId | Long | 그룹 ID |
| memberId | Long | 강퇴할 멤버 ID |

**Response** (200 OK):
```json
{
  "code": "SUCCESS",
  "message": "성공",
  "data": null
}
```

---

## Feed API

### 1. 그룹 피드 조회
```
GET /api/v1/groups/{groupId}/feeds
```

**인증**: 필수

**Path Parameters**:
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| groupId | Long | 그룹 ID |

**Response** (200 OK):
```json
{
  "code": "SUCCESS",
  "message": "성공",
  "data": [
    {
      "id": 1,
      "content": "오늘 저녁은 김치찌개!",
      "feedType": "USER_CREATED",
      "authorId": 1,
      "authorName": "홍길동",
      "createdAt": "2025-01-15T18:30:00"
    },
    {
      "id": 2,
      "content": "새 레시피가 추가되었습니다: 된장찌개",
      "feedType": "NEW_RECIPE_ADDED",
      "authorId": 2,
      "authorName": "김철수",
      "createdAt": "2025-01-15T12:00:00"
    }
  ]
}
```

---

### 2. 피드 생성
```
POST /api/v1/groups/{groupId}/feeds
```

**인증**: 필수

**Path Parameters**:
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| groupId | Long | 그룹 ID |

**Request Body**:
```json
{
  "content": "오늘 저녁은 김치찌개!",  // 필수, 최대 2000자
  "feedType": "USER_CREATED"           // 필수
}
```

**Response** (201 Created):
```json
{
  "code": "SUCCESS",
  "message": "성공",
  "data": null
}
```

---

## Shopping List API

### 1. 장볼거리 목록 조회
```
GET /api/v1/groups/{groupId}/shopping-list
```

**인증**: 필수

**Path Parameters**:
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| groupId | Long | 그룹 ID |

**Response** (200 OK):
```json
{
  "code": "SUCCESS",
  "message": "성공",
  "data": [
    {
      "id": 1,
      "name": "양파",
      "ingredientId": 10,
      "createdAt": "2025-01-15T10:30:00"
    },
    {
      "id": 2,
      "name": "대파",
      "ingredientId": 11,
      "createdAt": "2025-01-15T10:30:00"
    }
  ]
}
```

---

### 2. 장볼거리 일괄 생성
```
POST /api/v1/groups/{groupId}/shopping-list/bulk
```

**인증**: 필수

**Path Parameters**:
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| groupId | Long | 그룹 ID |

**Request Body**:
```json
{
  "items": [                    // 필수, 최소 1개
    { "recipeIngredientId": 1 },
    { "recipeIngredientId": 2 },
    { "recipeIngredientId": 3 }
  ]
}
```

**Response** (201 Created):
```json
{
  "code": "SUCCESS",
  "message": "성공",
  "data": null
}
```

---

### 3. 장볼거리 삭제
```
DELETE /api/v1/groups/{groupId}/shopping-list/{shoppingListId}
```

**인증**: 필수

**Path Parameters**:
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| groupId | Long | 그룹 ID |
| shoppingListId | Long | 장볼거리 ID |

**Response** (200 OK):
```json
{
  "code": "SUCCESS",
  "message": "성공",
  "data": null
}
```

---

## 에러 코드

| 코드 | HTTP 상태 | 설명 |
|------|----------|------|
| GROUP_001 | 404 | 그룹을 찾을 수 없습니다 |
| GROUP_002 | 403 | 그룹에 대한 접근 권한이 없습니다 |
| GROUP_003 | 403 | 그룹 관리자 권한이 필요합니다 |
| GROUP_004 | 409 | 이미 가입된 그룹입니다 |
| GROUP_005 | 400 | 유효하지 않은 초대 코드입니다 |
| GROUP_006 | 403 | 그룹 멤버가 아닙니다 |
| GROUP_009 | 400 | 만료된 초대 링크입니다 |
| GROUP_010 | 400 | 본인을 강퇴할 수 없습니다 |
| GROUP_011 | 404 | 그룹 멤버를 찾을 수 없습니다 |
| SHOPPING_LIST_001 | 404 | 장볼거리를 찾을 수 없습니다 |
| SHOPPING_LIST_002 | 400 | 해당 그룹의 장볼거리가 아닙니다 |
