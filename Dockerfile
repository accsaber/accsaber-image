FROM node
WORKDIR /var/app/fonts
RUN wget https://github.com/google/material-design-icons/raw/master/font/MaterialIconsRound-Regular.otf
RUN wget https://fonts.google.com/download?family=Montserrat -O Montserrat.zip
RUN wget https://fonts.google.com/download?family=Raleway -O Raleway.zip
RUN unzip Raleway.zip -dRaleway && unzip Montserrat.zip -dMontserrat
WORKDIR /var/app
COPY ["package.json", "package-lock.json", "./"]
RUN npm ci
ENV NODE_ENV=production
COPY . .
RUN npm run build
ENV PORT=8080
ENV HOST=0.0.0.0
EXPOSE 8080
CMD ["node", "build/server"]