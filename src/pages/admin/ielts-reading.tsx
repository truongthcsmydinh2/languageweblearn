import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import IeltsReadingAdmin from '@/components/admin/ielts-reading/IeltsReadingAdmin';

const IeltsReadingPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>IELTS Reading Admin - Vocab App</title>
        <meta name="description" content="Manage IELTS Reading passages and questions" />
      </Head>
      
      <IeltsReadingAdmin />
    </>
  );
};

export default IeltsReadingPage;