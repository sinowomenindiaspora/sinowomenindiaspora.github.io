import React from 'react';
import { Container, Typography, Box, Grid, Card, CardContent, CardMedia } from '@mui/material';
import footerPixels from '../assets/images/footer_pixels.png';
import styled from 'styled-components';

// 创建贡献者卡片组件
const ContributorCard = styled(Box)({
  display: 'flex',
  fontFamily:'Avenir',
  flexDirection: 'column',
  alignItems: 'flex-start',
  marginBottom: '20px',
  color: 'red',
});

function Contributors() {
  return (
    <Box sx={{ 
      color: 'white', 
      padding: '40px 0', 
    }}>
      <Container>
        <Typography 
          variant="h1" 
          sx={{ 
            fontFamily: 'balloon', 
            color: 'red', 
            textAlign: 'center',
            marginBottom: '40px',
            fontSize: '4rem'
          }}
        >
          Project Credits
        </Typography>
        
        {/* 项目描述 */}
        <Typography 
          sx={{ 
            color: 'red', 
            textAlign: 'center',
            marginBottom: '60px',
            fontSize: '0.9rem'
          }}
        >
          This project wouldn't have been possible without the care, creativity, and conversations shared by these wonderful collaborators:
        </Typography>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <ContributorCard>
              <Typography sx={{ fontFamily: 'balloon', marginBottom: '10px' }}>
               🌀 Manman｜Promotion, Project Discussions
              </Typography>
              <Typography variant="body2">
                Hi everyone! I’m Manman (漫漫) — a writer/PhD student who loves surfing the internet and hopes to make a few waves through content creation.
              </Typography>
            </ContributorCard>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <ContributorCard>
              <Typography sx={{ fontFamily: 'balloon', marginBottom: '10px' }}>
               💻 鸟｜Everything with Codes
              </Typography>
              <Typography variant="body2">
               Hi, I’m Bird (鸟)! Surfing online just to question everything and finally met these people to build this site. What does Asian say?
              </Typography>
            </ContributorCard>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <ContributorCard>
              <Typography sx={{ fontFamily: 'balloon', marginBottom: '10px' }}>
              📣 Noora｜Outreach & Project Discussions
              </Typography>
              <Typography variant="body2">
               Hi! I’m Noora — a gender/migration studies PhD student who does a little bit of everything and dreams of co-creating new spaces with sisters.
              </Typography>
            </ContributorCard>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <ContributorCard>
              <Typography sx={{ fontFamily: 'balloon', marginBottom: '10px' }}>
               🎨 Qianchi｜Web Design & Project Discussions
              </Typography>
              <Typography variant="body2">
               Hi, I’m Qiu Qianchi — a designer who doesn’t really like being online but somehow ended up building a website. Fate?
              </Typography>
            </ContributorCard>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <ContributorCard>
              <Typography sx={{ fontFamily: 'balloon', marginBottom: '10px' }}>
              💬 Bibi｜Copywriting & Project Discussions
              </Typography>
              <Typography variant="body2">
               Hi! I’m Bibi (or Bǐbǐ, or even BǐBì!) — playing with words and polishing thoughts is my kind of fun.
               </Typography>
            </ContributorCard>
          </Grid>
        </Grid>
        

      </Container>
    </Box>
  );
}

export default Contributors;