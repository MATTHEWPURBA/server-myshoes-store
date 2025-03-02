# Install commonly used Shadcn UI components

npx shadcn-ui@latest add dropdown-menu

# UI Components

npx shadcn@latest add alert
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add avatar
npx shadcn@latest add badge
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add form
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add select
npx shadcn@latest add table
npx shadcn@latest add toast

# ... and many more

---------------------------------------------

please provide me approach to make simple Shoes E-Commerce Website for my Portfolio so that User will be interested at my Full Stack Developer Skills

using these tech stacks for Front End and Back End :

    - Frontend (Client-side):

        - React + Vite + TypeScript
        - Tailwind CSS
        - Shadcn/ui as Bootstrap

    - Authentication:
        - NextAuth.js for social login (Google, GitHub)


    - Backend (Server-side):
        - Node.js with Express.js
        - Prisma as ORM

    - Database:
        - PostgreSQL

    - Cloud Hosting (Free Options):
        - Frontend: Firebase
        - Backend: Render

    - 3rd Party API
        - Image Management:
            - Cloudinary (Generous free tier)
        - Search Implementation:
            - Algolia
        - Email Services:
            - SendGrid

if its possible, make sure you dont provide me any approach that is include hardcode, and make it as dynamic as possible

provide me options of approach to make this website have logic for 2 user authentication system with User Login (as buyer) and Admin Login as Admin (as Administrator to manage product in the website)

And make the websites online so i can use this website as Showcase Portfolio.

add extreme detail explanation for the approach so i can understand all the method eaasily

provide more detailed information about getting started with all part of the implementation

give me extreme detailed information on how to set up for the projects, and all the Command Lines that i need to make this project more easy

---------------------------------------------


----front end

sudo npm create vite@latest client -- --template react-ts
sudo npm install @types/node autoprefixer postcss tailwindcss
sudo npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
sudo npm install next-auth @auth/prisma-adapter
sudo npm install axios react-query react-hot-toast
sudo npm install @cloudinary/react @cloudinary/url-gen
sudo npm install algoliasearch
sudo npm install @sendgrid/mail

----front end


---back end

sudo npm install express prisma @prisma/client cors dotenv
sudo npm install bcryptjs jsonwebtoken
sudo npm install cloudinary multer
sudo npm install @sendgrid/mail
sudo npm install -D typescript ts-node @types/express @types/node

---back end


DATABASE_URL="postgresql://postgres:Robherto82@localhost:5432/shoes_ecommerce"

