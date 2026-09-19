# 🚀 Blog Application on AWS ECS Fargate

![AWS](https://img.shields.io/badge/AWS-ECS%20Fargate-orange)
![Docker](https://img.shields.io/badge/Container-Docker-blue)
![ALB](https://img.shields.io/badge/Load%20Balancer-ALB-yellow)
![Database](https://img.shields.io/badge/Database-PostgreSQL-blue)
![Status](https://img.shields.io/badge/Status-Deployed-success)

A containerized full-stack blog application deployed on **AWS ECS Fargate**, using **Docker, Application Load Balancer, and Amazon RDS PostgreSQL**.

The project demonstrates container deployment, AWS networking, load balancing, database connectivity, security groups, and troubleshooting of a real cloud-hosted application.

---

## 📌 Project Overview

The application consists of:

- **Frontend** — Nginx-based frontend container
- **Backend** — Node.js application container
- **Database** — Amazon RDS PostgreSQL
- **Container Platform** — Amazon ECS Fargate
- **Load Balancer** — Application Load Balancer
- **Container Registry** — Amazon ECR
- **Networking & Security** — VPC, subnets, and security groups

### Architecture Flow

```text
                         Internet
                            │
                            ▼
                  ┌─────────────────┐
                  │  Application    │
                  │ Load Balancer   │
                  └────────┬────────┘
                           │
                  ┌────────┴────────┐
                  ▼                 ▼
          ┌──────────────┐   ┌──────────────┐
          │   Frontend   │   │   Backend    │
          │    Nginx     │   │   Node.js    │
          │    Port 80   │   │   Port 5000  │
          └──────────────┘   └───────┬──────┘
                                     │
                                     ▼
                              ┌─────────────┐
                              │ Amazon RDS  │
                              │ PostgreSQL  │
                              │   Port 5432 │
                              └─────────────┘
````

---

## 🏗️ Architecture Diagram

![Architecture Diagram](images/Architecture-Diagram.png)

---

## ☁️ AWS Services Used

| Service                       | Purpose                                 |
| ----------------------------- | --------------------------------------- |
| **Amazon ECS Fargate**        | Runs frontend and backend containers    |
| **Amazon ECR**                | Stores Docker images                    |
| **Application Load Balancer** | Routes HTTP traffic to ECS services     |
| **Amazon RDS PostgreSQL**     | Stores blog application data            |
| **Amazon VPC**                | Provides networking infrastructure      |
| **Security Groups**           | Controls traffic between components     |
| **IAM**                       | Provides ECS task execution permissions |

---

## 🐳 Application Components

### Frontend

* Containerized using Docker
* Served using Nginx
* Exposed on port `80`

### Backend

* Node.js application
* Containerized using Docker
* Exposed on port `5000`
* Provides the blog API

### Database

* Amazon RDS PostgreSQL
* PostgreSQL port: `5432`
* Stores blog posts

Example database table:

```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title TEXT,
  content TEXT
);
```

---

# ⚙️ Deployment Workflow

The application was deployed using the following workflow:

```text
Application Source
       │
       ▼
   Docker Build
       │
       ▼
   Amazon ECR
       │
       ▼
  ECS Fargate
       │
       ▼
Application Load Balancer
       │
       ▼
Frontend → Backend → RDS PostgreSQL
```

---

# 🔧 Deployment Steps

> **AWS Region:** `ap-south-1`
> Replace placeholder values such as `ACCOUNT_ID`, `YOUR_VPC_ID`, and resource IDs with your own values.

---

## 1. Create ECR Repositories

```bash
aws ecr create-repository \
  --repository-name blog-backend \
  --region ap-south-1

aws ecr create-repository \
  --repository-name blog-frontend \
  --region ap-south-1
```

---

## 2. Authenticate Docker with ECR

```bash
aws ecr get-login-password \
  --region ap-south-1 | \
docker login \
  --username AWS \
  --password-stdin ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com
```

---

## 3. Build and Push Docker Images

### Backend

```bash
docker build -t blog-backend ./backend

docker tag blog-backend:latest \
ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/blog-backend:latest

docker push \
ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/blog-backend:latest
```

### Frontend

```bash
docker build -t blog-frontend ./frontend

docker tag blog-frontend:latest \
ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/blog-frontend:latest

docker push \
ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/blog-frontend:latest
```

---

## 4. Create ECS Task Execution Role

Create the IAM role:

```bash
aws iam create-role \
  --role-name ecsTaskExecutionRoleBlog \
  --assume-role-policy-document file://ecs-trust.json
```

Attach the ECS task execution policy:

```bash
aws iam attach-role-policy \
  --role-name ecsTaskExecutionRoleBlog \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
```

---

## 5. Register ECS Task Definitions

```bash
aws ecs register-task-definition \
  --cli-input-json file://backend-task.json \
  --region ap-south-1

aws ecs register-task-definition \
  --cli-input-json file://frontend-task.json \
  --region ap-south-1
```

---

## 6. Configure Networking

Retrieve the VPC:

```bash
aws ec2 describe-vpcs \
  --query "Vpcs[0].VpcId" \
  --output text \
  --region ap-south-1
```

Retrieve the subnets:

```bash
aws ec2 describe-subnets \
  --filters Name=vpc-id,Values=YOUR_VPC_ID \
  --query "Subnets[*].SubnetId" \
  --output text \
  --region ap-south-1
```

---

## 7. Configure Security Groups

### ALB Security Group

Create the security group:

```bash
aws ec2 create-security-group \
  --group-name blog-alb-sg \
  --description "ALB Security Group" \
  --vpc-id YOUR_VPC_ID \
  --region ap-south-1
```

Allow HTTP traffic:

```bash
aws ec2 authorize-security-group-ingress \
  --group-id ALB_SG_ID \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0 \
  --region ap-south-1
```

### ECS Security Group

```bash
aws ec2 create-security-group \
  --group-name blog-ecs-sg \
  --description "ECS Security Group" \
  --vpc-id YOUR_VPC_ID \
  --region ap-south-1
```

Allow frontend traffic from the ALB:

```bash
aws ec2 authorize-security-group-ingress \
  --group-id ECS_SG_ID \
  --protocol tcp \
  --port 80 \
  --source-group ALB_SG_ID \
  --region ap-south-1
```

Allow backend traffic from the ALB:

```bash
aws ec2 authorize-security-group-ingress \
  --group-id ECS_SG_ID \
  --protocol tcp \
  --port 5000 \
  --source-group ALB_SG_ID \
  --region ap-south-1
```

### RDS Security Group

Allow PostgreSQL traffic from the ECS security group:

```bash
aws ec2 authorize-security-group-ingress \
  --group-id RDS_SG_ID \
  --protocol tcp \
  --port 5432 \
  --source-group ECS_SG_ID \
  --region ap-south-1
```

---

# 🎯 Load Balancer Configuration

## 8. Create Target Groups

### Frontend Target Group

```bash
aws elbv2 create-target-group \
  --name blog-frontend-tg \
  --protocol HTTP \
  --port 80 \
  --target-type ip \
  --vpc-id YOUR_VPC_ID \
  --region ap-south-1
```

### Backend Target Group

```bash
aws elbv2 create-target-group \
  --name blog-backend-tg \
  --protocol HTTP \
  --port 5000 \
  --target-type ip \
  --vpc-id YOUR_VPC_ID \
  --health-check-path /api/posts \
  --region ap-south-1
```

---

## 9. Create Application Load Balancer

```bash
aws elbv2 create-load-balancer \
  --name blog-alb \
  --subnets SUBNET1 SUBNET2 SUBNET3 \
  --security-groups ALB_SG_ID \
  --scheme internet-facing \
  --type application \
  --region ap-south-1
```

---

## 10. Create Listener

```bash
aws elbv2 create-listener \
  --load-balancer-arn ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=FRONTEND_TG_ARN \
  --region ap-south-1
```

---

# 🚢 ECS Fargate Deployment

## 11. Create ECS Cluster

```bash
aws ecs create-cluster \
  --cluster-name blog-cluster \
  --region ap-south-1
```

---

## 12. Create Backend Service

```bash
aws ecs create-service \
  --cluster blog-cluster \
  --service-name blog-backend-service \
  --task-definition blog-backend \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration \
  "awsvpcConfiguration={subnets=[SUBNET1,SUBNET2,SUBNET3],securityGroups=[ECS_SG_ID],assignPublicIp=ENABLED}" \
  --load-balancers \
  "targetGroupArn=BACKEND_TG_ARN,containerName=backend,containerPort=5000" \
  --region ap-south-1
```

---

## 13. Create Frontend Service

```bash
aws ecs create-service \
  --cluster blog-cluster \
  --service-name blog-frontend-service \
  --task-definition blog-frontend \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration \
  "awsvpcConfiguration={subnets=[SUBNET1,SUBNET2,SUBNET3],securityGroups=[ECS_SG_ID],assignPublicIp=ENABLED}" \
  --load-balancers \
  "targetGroupArn=FRONTEND_TG_ARN,containerName=frontend,containerPort=80" \
  --region ap-south-1
```

---

# 🗄️ Database

Connect to the PostgreSQL RDS instance:

```bash
psql -h YOUR_RDS_ENDPOINT \
  -U postgres \
  -d blogdb
```

Create the `posts` table:

```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title TEXT,
  content TEXT
);
```

---

# 🌐 Application Access

Once the ECS services and ALB are healthy:

```text
http://YOUR-ALB-DNS
```

The request flow is:

```text
User
  ↓
Application Load Balancer
  ↓
Frontend Container
  ↓
Backend Container
  ↓
RDS PostgreSQL
```

---

# 📸 Deployment Evidence

## Application UI

![Application UI](images/ui.png)

## ECS Services

![ECS Services](images/ecs.png)

## Target Group

![Target Group](images/target-group.png)

## Amazon RDS

![RDS](images/rds.png)

## Application Load Balancer

![ALB](images/alb.png)

---

# 🛠️ Challenges & Troubleshooting

During deployment, several application and infrastructure issues were encountered and resolved.

### 🔴 500 Internal Server Error

**Cause:** Database connection issue.

**Resolution:** Corrected the RDS endpoint and reviewed security group connectivity.

---

### 🔴 503 / 504 Errors

**Cause:** Load balancer routing or target health issues.

**Resolution:** Checked target groups, listeners, and ECS service configuration.

---

### 🔴 `pg_hba.conf` Error

**Cause:** Database connectivity was blocked between ECS and RDS.

**Resolution:** Allowed PostgreSQL traffic from the ECS security group to the RDS security group.

---

### 🔴 Container Exit Code 1

**Cause:** Frontend container startup issue.

**Resolution:** Corrected the Dockerfile and Nginx configuration.

---

### 🔴 `e.map is not a function`

**Cause:** The API response was not returning the expected array structure.

**Resolution:** Corrected the API response so the frontend received an array.

---

# 🧠 Key Learnings

Through this project, I gained hands-on experience with:

* Amazon ECS Fargate
* Docker containerization
* Amazon ECR
* Application Load Balancer
* Amazon RDS PostgreSQL
* AWS VPC networking
* Security Groups
* IAM roles
* ECS task definitions
* Target groups and health checks
* Container troubleshooting
* Application-to-database connectivity
* Cloud deployment and debugging

---

# 📂 Project Structure

```text
blog-ecs-app/
│
├── backend/
│
├── frontend/
│
├── images/
│   ├── Architecture-Diagram.png
│   ├── ui.png
│   ├── ecs.png
│   ├── target-group.png
│   ├── rds.png
│   └── alb.png
│
└── README.md
```

---

# 🎯 Project Outcome

The project demonstrates a complete containerized application deployment on AWS:

```text
Docker
   ↓
Amazon ECR
   ↓
ECS Fargate
   ↓
Application Load Balancer
   ↓
Frontend + Backend
   ↓
Amazon RDS PostgreSQL
```

The application was deployed and validated through the AWS console, ECS services, target groups, RDS, ALB, and the application interface.

---

## 👨‍💻 Author

### Snehal Pawar

**Aspiring DevOps Engineer | AWS | Docker | Kubernetes | Terraform | Jenkins**

* GitHub: [snehalpawar29](https://github.com/snehalpawar29)
* LinkedIn: [Snehal Pawar](https://www.linkedin.com/in/snehalpawar29/)
