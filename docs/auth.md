Originally Authored with Hackmd.io [Link](https://hackmd.io/CYBghgzATCCsCMBaAHGAZiRAWCsqIE4AjdRUZEYKCLMANmDCA===?both)

## Current Auth Flow 
### With Enterprise Web

Postgres is the source of truth for authorization credentials.
Plutonium only cares if the username is passed properly and signed.
_NOTE: JWT is never generated by the database. Influx OSS just checks that it is signed with the same secret._
```sequence
participant Pu Data Node
participant Entr. BrowserClient
participant Entr. WebServer
participant Postgres
Note left of Entr. BrowserClient: START!
Entr. BrowserClient->Entr. WebServer: Authorize me, please.
Note right of Entr. WebServer: It just so happens there's a\ndb username of the same\nname in Pu.
Entr. WebServer->Postgres: Find user record
Postgres-->Entr. WebServer: 
Note over Entr. WebServer: Confirm submitted\npassword
Note over Entr. WebServer: Generate JWT\nwith username
Entr. WebServer-->Entr. BrowserClient: JWT
Entr. BrowserClient->Pu Data Node: POST /query with JWT in Header
Note over Pu Data Node: Check JWT signature\n& that user exists
Pu Data Node-->Entr. BrowserClient: query results
```

### With OSS Flow

In this example, I have the shared secret in a file on my Terminal.
_NOTE: JWT is never generated by the database. Influx OSS just checks that it is signed with the same secret._
```sequence
participant Terminal
participant InfluxDB
Note over Terminal: Generate JWT\nusing jwtgen\nw/username\n& expiration.
Note right of Terminal: i.e. `jwtgen -a HS512 -s $SHAREDSECRET\n-c "username=cpg"  -e 3600 -v`

Terminal->InfluxDB: POST /query w/JWT Header
Note over InfluxDB: Check JWT signature\n& that user exists

InfluxDB-->Terminal: query results
```

## Desired Auth Flow with Mr Fusion using Bolt.

This describes what we'd like to see. 
_NOTE: Bolt might initially be replaced with a flat file. Obviously, we'd like to ship with Bolt. After that the plan is to be able to store in other system such as Influx, etcd, etc…_

```sequence
participant WebClient
participant Service
participant Influx/Pu

WebClient->Service: POST /auth 
Note right of WebClient: Payload:{ username:"foo",\npassword:"bar",}\nHeader:{XSRF-TOKEN}

Note over Service: Generate JWT
Service-->WebClient: JWT with claims
Note left of Service: Claims:\niss: "https://mrfusion.com",\nexp: "NumericDate",\nsub: "foo@bar.com",\naud:"MrFusionWebClient"

Note over WebClient: store JWT cookie,\nlocalStorage,\n sessionStorage

Note over WebClient: User creates a Source

WebClient->Service: \nPOST /sources w/JWT Header,\nPayload: url: "http...",\nusername: 'admin', \npassword: 'pass'

Note over Service: Verify Signature
Note over Service: Store Source in Bolt
Service-->WebClient: 201

WebClient->Service: POST /sources/:id/proxy w/JWT in header
Service->Influx/Pu: POST /query w/Basic Auth
Note over Influx/Pu: Verify password
Influx/Pu-->Service: query results
Service-->WebClient: query results
Note over WebClient: Display results
```

## Notes:

* How do we keep the Data Source passwords safe?
    * Salt & Hash.
    * For v1 we'll use the same salting method as Pu