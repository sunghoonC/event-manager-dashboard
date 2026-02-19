# 외부 서버 연동 가이드

이 대시보드는 정적 프론트엔드로 개발되었으며, 외부 서버, 데이터베이스, GraphQL 쿼리와의 연동을 위한 구조를 제공합니다.

## 데이터 연동 방법

### 1. GraphQL 클라이언트 설정

```bash
pnpm add @apollo/client graphql
```

`client/src/lib/apollo.ts` 파일을 생성하여 Apollo Client를 설정합니다:

```typescript
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const httpLink = new HttpLink({
  uri: 'YOUR_GRAPHQL_ENDPOINT', // 실제 GraphQL 엔드포인트로 변경
  credentials: 'include', // 쿠키 기반 인증 사용 시
});

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});
```

### 2. App.tsx에 Provider 추가

```typescript
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from './lib/apollo';

function App() {
  return (
    <ApolloProvider client={apolloClient}>
      {/* 기존 코드 */}
    </ApolloProvider>
  );
}
```

### 3. 컴포넌트에서 쿼리 사용

```typescript
import { useQuery, gql } from '@apollo/client';

const GET_EVENTS = gql`
  query GetEvents {
    events {
      id
      title
      date
      status
    }
  }
`;

function EventList() {
  const { loading, error, data } = useQuery(GET_EVENTS);
  
  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>오류 발생: {error.message}</div>;
  
  return (
    <div>
      {data.events.map(event => (
        <div key={event.id}>{event.title}</div>
      ))}
    </div>
  );
}
```

## REST API 연동

GraphQL 대신 REST API를 사용하는 경우:

```typescript
// client/src/lib/api.ts
const API_BASE_URL = 'YOUR_API_ENDPOINT';

export async function fetchEvents() {
  const response = await fetch(`${API_BASE_URL}/events`);
  if (!response.ok) throw new Error('Failed to fetch events');
  return response.json();
}

// 컴포넌트에서 사용
import { useEffect, useState } from 'react';
import { fetchEvents } from '@/lib/api';

function EventList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchEvents()
      .then(data => setEvents(data))
      .finally(() => setLoading(false));
  }, []);
  
  // ...
}
```

## 환경 변수 설정

`.env` 파일을 프로젝트 루트에 생성:

```
VITE_API_URL=https://your-api-endpoint.com
VITE_GRAPHQL_URL=https://your-graphql-endpoint.com/graphql
```

코드에서 사용:

```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

## 인증 처리

토큰 기반 인증을 사용하는 경우:

```typescript
// client/src/lib/apollo.ts
import { setContext } from '@apollo/client/link/context';

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('auth_token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
```

## 프로젝트 구조

```
client/src/
  lib/          ← API 클라이언트, 유틸리티 함수
  hooks/        ← 커스텀 훅 (데이터 페칭 등)
  pages/        ← 페이지 컴포넌트
  components/   ← 재사용 가능한 UI 컴포넌트
```

데이터 페칭 로직은 `lib/` 또는 `hooks/`에 배치하고, 컴포넌트는 이를 호출하는 방식으로 구조화하면 유지보수가 용이합니다.
